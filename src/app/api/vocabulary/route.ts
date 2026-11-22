import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { ENTRY_KINDS, validateEntry } from "@/modules/vocabulary/entry";
import { VocabularyRepository } from "@/modules/vocabulary/repository";
import { CEFR_LEVELS, type CefrLevel } from "@/shared/types";

const createEntrySchema = z.object({
  term: z.string(),
  definition: z.string(),
  example: z.string(),
  kind: z.enum(ENTRY_KINDS),
  level: z.enum(CEFR_LEVELS as [CefrLevel, ...CefrLevel[]]),
  module: z.string().min(2).max(60),
  particle: z.string().max(20).optional(),
  separable: z.boolean().optional(),
  register: z.enum(["neutral", "informal", "formal"]).optional(),
  function: z.enum(["hedge", "soften", "persuade", "report", "compare", "express"]).optional(),
  extraExample: z.string().max(400).optional(),
  notes: z.string().max(400).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleSlug = searchParams.get("module");
  const level = searchParams.get("level") as CefrLevel | null;
  const kind = searchParams.get("kind");

  const repository = new VocabularyRepository();

  if (kind) {
    if (!(ENTRY_KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json({ error: "kind must be WORD, PHRASAL_VERB or PATTERN" }, { status: 400 });
    }
    if (moduleSlug) {
      const entries = await repository.findByModule(moduleSlug, level ?? undefined);
      return NextResponse.json(entries.filter((entry) => entry.kind === kind));
    }
    return NextResponse.json(await repository.findByKind(kind as (typeof ENTRY_KINDS)[number]));
  }

  if (!moduleSlug) return NextResponse.json({ error: "module required" }, { status: 400 });
  const vocab = await repository.findByModule(moduleSlug, level ?? undefined);
  return NextResponse.json(vocab);
}

/**
 * Adds an entry the learner wrote themselves.
 *
 * The entry is validated with the same rules the bank uses (a phrasal verb needs
 * a real particle, a pattern needs slots, the example must use the entry) and it
 * gets its first review row, so it shows up in the queue instead of disappearing.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid entry", issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) },
      { status: 400 },
    );
  }

  const draft = parsed.data;
  const validation = validateEntry(draft);
  if (!validation.ok) {
    return NextResponse.json({ error: "invalid entry", issues: validation.errors }, { status: 400 });
  }

  const moduleRow = await prisma.module.findUnique({ where: { slug: draft.module } });
  if (!moduleRow) {
    return NextResponse.json({ error: "invalid entry", issues: [`unknown module: ${draft.module}`] }, { status: 400 });
  }

  const repository = new VocabularyRepository();
  const existing = await repository.findByTermAndKind(validation.term, draft.kind);
  if (existing) {
    return NextResponse.json(
      { error: `"${validation.term}" is already in your ${draft.kind === "PHRASAL_VERB" ? "phrasal verbs" : draft.kind === "PATTERN" ? "patterns" : "words"}` },
      { status: 409 },
    );
  }

  const user = await getLocalUser();
  const created = await repository.createUserEntry(user.id, {
    ...draft,
    term: validation.term,
    particle: validation.particle,
  });

  return NextResponse.json(created, { status: 201 });
}
