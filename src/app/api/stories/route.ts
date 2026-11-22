import { NextRequest, NextResponse } from "next/server";
import { StoryRepository } from "@/modules/stories/repository";
import { CEFR_LEVELS, type CefrLevel } from "@/shared/types";

/** Lists generated stories, optionally scoped to a module and a level. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleSlug = searchParams.get("module") ?? undefined;
  const level = searchParams.get("level");

  if (level && !CEFR_LEVELS.includes(level as CefrLevel)) {
    return NextResponse.json({ error: "level must be a CEFR level" }, { status: 400 });
  }

  const repository = new StoryRepository();
  const stories = await repository.list({
    module: moduleSlug,
    level: (level as CefrLevel | null) ?? undefined,
  });

  return NextResponse.json(stories);
}
