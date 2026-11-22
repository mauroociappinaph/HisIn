import { NextRequest, NextResponse } from "next/server";
import { VocabularyRepository } from "@/modules/vocabulary/repository";
import { validateUpdate } from "@/modules/vocabulary/update";

/**
 * Corrects an entry the learner added: the definition, the example, the note or
 * the grammar metadata the engine may have tagged wrong. Identity (level, module,
 * source) is not editable, and seeded content is never touched.
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repository = new VocabularyRepository();
  const entry = await repository.findById(id);

  if (!entry) return NextResponse.json({ error: "entry not found" }, { status: 404 });
  if (entry.source !== "USER") {
    return NextResponse.json({ error: "solo podés editar lo que agregaste vos" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const validation = validateUpdate(body);
  if (!validation.ok) {
    return NextResponse.json({ error: "cambios inválidos", issues: validation.errors }, { status: 400 });
  }

  const updated = await repository.updateEntry(id, validation.update);
  return NextResponse.json(updated);
}

/**
 * Removes an entry the learner added. Seeded and generated entries belong to the
 * curriculum, so they are not deletable from the app.
 */
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repository = new VocabularyRepository();
  const entry = await repository.findById(id);

  if (!entry) return NextResponse.json({ error: "entry not found" }, { status: 404 });
  if (entry.source !== "USER") {
    return NextResponse.json({ error: "only entries you added can be deleted" }, { status: 403 });
  }

  await repository.deleteById(id);
  return new NextResponse(null, { status: 204 });
}
