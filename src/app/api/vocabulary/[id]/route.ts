import { NextRequest, NextResponse } from "next/server";
import { VocabularyRepository } from "@/modules/vocabulary/repository";

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
