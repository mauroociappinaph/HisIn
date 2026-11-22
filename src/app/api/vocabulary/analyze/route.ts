import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { getLocalUser } from "@/modules/identity/service";
import { buildEntryPrompt, ENTRY_SYSTEM_PROMPT, parseEntryAnalysis, sectionFor } from "@/modules/vocabulary/analysis";
import { VocabularyRepository } from "@/modules/vocabulary/repository";

const inputSchema = z.object({ input: z.string().trim().min(2).max(120) });

/**
 * One field in, a filed entry out.
 *
 * The learner types what they met and Gentle Shell decides what it is, writes the
 * definition and an example in their own domain, and the entry is stored under
 * the section it belongs to. Nothing is written unless the reply passes the same
 * rules the manual form uses.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "escribí una palabra o una frase" }, { status: 400 });
  }

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no hay modelo configurado" }, { status: 500 });

  let raw: string;
  try {
    const response = await runGentleShell({
      prompt: buildEntryPrompt(parsed.data.input),
      system: ENTRY_SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs() * 2,
    });
    raw = response.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `el motor no respondió: ${message}` }, { status: 502 });
  }

  const result = parseEntryAnalysis(raw);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  const { analysis } = result;

  const moduleRow = await prisma.module.findUnique({ where: { slug: analysis.module } });
  if (!moduleRow) {
    return NextResponse.json({ error: `el módulo "${analysis.module}" no existe` }, { status: 422 });
  }

  const repository = new VocabularyRepository();
  const existing = await repository.findByTermAndKind(analysis.term, analysis.kind);
  if (existing) {
    return NextResponse.json(
      {
        error: `"${analysis.term}" ya está en tu biblioteca`,
        existingId: existing.id,
        section: sectionFor(analysis.kind),
      },
      { status: 409 },
    );
  }

  const user = await getLocalUser();
  const entry = await repository.createUserEntry(user.id, {
    term: analysis.term,
    definition: analysis.definition,
    example: analysis.example,
    module: analysis.module,
    level: analysis.level,
    kind: analysis.kind,
    particle: analysis.particle ?? null,
    separable: analysis.separable ?? null,
    register: analysis.register ?? null,
    function: analysis.function ?? null,
    notes: analysis.notes ?? null,
  });

  return NextResponse.json({ entry, section: sectionFor(analysis.kind) }, { status: 201 });
}
