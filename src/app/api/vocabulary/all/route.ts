import { NextResponse } from "next/server";
import { VocabularyRepository } from "@/modules/vocabulary/repository";

/**
 * Whole vocabulary bank. The explorer and the challenge need every word at
 * once; `/api/vocabulary` stays module-scoped because other callers rely on it.
 */
export async function GET() {
  const repo = new VocabularyRepository();
  const vocabulary = await repo.findAll();
  return NextResponse.json(vocabulary);
}
