import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";

/**
 * A short Spanish equivalent for one word or phrase the learner is reading.
 *
 * The stored glossary covers the words the engine picked; this answers the word
 * the learner picked instead. One call, one line back: no definitions, no prose.
 */
const requestSchema = z.object({
  term: z.string().trim().min(2).max(60),
  context: z.string().trim().max(400).optional(),
});

const SYSTEM_PROMPT =
  "You translate English into Spanish from Argentina for a learner. Answer with the translation only: one to four words, no quotes, no explanation, no alternatives.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "pasá una palabra o una frase" }, { status: 400 });
  }

  try {
    const response = await runWithFallback({
      prompt: [
        `Term: ${JSON.stringify(parsed.data.term)}`,
        parsed.data.context ? `In this sentence: ${JSON.stringify(parsed.data.context.slice(0, 300))}` : "",
        "Translate the term as it is used above.",
      ]
        .filter(Boolean)
        .join("\n"),
      system: SYSTEM_PROMPT,
      timeoutMs: resolveTimeoutMs(),
    });

    const translation = response.text
      .trim()
      .replace(/^["“']|["”']$/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 80);

    if (translation.length < 2) {
      return NextResponse.json({ error: "no pudimos traducirlo" }, { status: 502 });
    }

    return NextResponse.json({ translation }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
