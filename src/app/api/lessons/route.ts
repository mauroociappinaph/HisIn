import { NextRequest, NextResponse } from "next/server";
import { LessonRepository } from "@/modules/lessons/repository";
import type { CefrLevel } from "@/shared/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleSlug = searchParams.get("module");
  const level = searchParams.get("level") as CefrLevel | null;
  if (!moduleSlug) return NextResponse.json({ error: "module required" }, { status: 400 });
  const repo = new LessonRepository();
  const lessons = await repo.findByModule(moduleSlug, level ?? undefined);
  return NextResponse.json(lessons);
}
