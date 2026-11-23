import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";
import { normalise } from "@/modules/search/search";

/**
 * What does this term mean: the cache first, the engine once.
 *
 * The learner hovers the same unknown word in five texts. Answering from the stored
 * gloss costs nothing and is instant; asking the engine every time would be slow and
 * would repeat the same work forever. One row per normalised term is the whole
 * deduplication.
 */
const requestSchema = z.object({
  term: z.string().trim().min(2).max(60),
  context: z.string().trim().max(300).optional(),
});

const KINDS = ["word", "phrasal_verb", "pattern", "idiom", "collocation", "expression"] as const;

/** Function words need no gloss, and caching them would pollute the dictionary. */
const STOP = new Set([
  "the","a","an","and","or","but","in","on","at","to","of","for","with","is","are","was","were","be","been",
  "it","its","this","that","these","those","i","you","he","she","we","they","his","her","their","my","your",
  "our","as","by","from","so","if","not","no","do","does","did","has","have","had","will","would","can",
  "want","make","get","how","what","when","where","who","why",
]);

const SYSTEM_PROMPT = [
  "You explain English terms to Spanish-speaking healthtech founders.",
  "Answer in Spanish from Argentina, short and idiomatic.",
  'Return ONLY a JSON object: {"translation","kind","note"} where kind is one of word, phrasal_verb, pattern, idiom, collocation, expression.',
  "translation is the Spanish equivalent, one to five words, never a definition.",
  "note is optional: one short Spanish clarification, or the register where it is used.",
].join(" ");

const answerSchema = z.object({
  translation: z.string().trim().min(2).max(80),
  kind: z.enum(KINDS).default("word"),
  note: z.string().trim().max(140).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "pasa una palabra o una frase" }, { status: 400 });

  const term = parsed.data.term.replace(/\s+/g, " ").trim();
  const key = normalise(term);

  // A single function word is answered without asking anything: it keeps the cache
  // useful, and a learner hovering "your" does not need a dictionary.
  if (!key.includes(" ") && STOP.has(key)) {
    return NextResponse.json(
      { term, translation: "palabra funcional", kind: "word", note: "Se usa para armar la frase; no lleva glosa.", cached: true },
      { status: 200 },
    );
  }

  const cached = await prisma.termGloss.findUnique({ where: { key } });
  if (cached) {
    return NextResponse.json(
      { term: cached.term, translation: cached.translation, kind: cached.kind, note: cached.note, cached: true },
      { status: 200 },
    );
  }

  try {
    const response = await runWithFallback({
      prompt: [
        `Term: ${JSON.stringify(term)}`,
        parsed.data.context ? `Where it appears: ${JSON.stringify(parsed.data.context.slice(0, 250))}` : "",
        "Explain the term as it is used there.",
      ]
        .filter(Boolean)
        .join("\n"),
      system: SYSTEM_PROMPT,
      timeoutMs: resolveTimeoutMs(),
    });

    const cleaned = response.text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const answer = answerSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));

    await prisma.termGloss.upsert({
      where: { key },
      update: { translation: answer.translation, kind: answer.kind, note: answer.note ?? null },
      create: { key, term, translation: answer.translation, kind: answer.kind, note: answer.note ?? null },
    });

    return NextResponse.json({ term, ...answer, cached: false }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "no pudimos explicarlo" },
      { status: 502 },
    );
  }
}

/** Fills the cache for a list of terms in one go, so a lesson can prewarm itself. */
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { terms?: string[] } | null;
  const terms = (body?.terms ?? []).map((term) => term.trim()).filter((term) => term.length > 1).slice(0, 40);
  if (terms.length === 0) return NextResponse.json({ cached: 0 }, { status: 200 });

  const keys = terms.map((term) => normalise(term));
  const rows = await prisma.termGloss.findMany({ where: { key: { in: keys } } });
  return NextResponse.json({ cached: rows.length, terms: rows }, { status: 200 });
}
