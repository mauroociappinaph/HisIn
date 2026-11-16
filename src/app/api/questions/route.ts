import { NextRequest, NextResponse } from "next/server";
import { AssessmentRepository } from "@/modules/assessment/repository";
import type { CefrLevel, Skill } from "@/shared/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level") as CefrLevel | null;
  const skill = searchParams.get("skill") as Skill | null;
  const limit = Number(searchParams.get("limit") ?? "50");
  const repo = new AssessmentRepository();
  const questions = await repo.findQuestions({
    level: level ?? undefined,
    skill: skill ?? undefined,
    limit,
  });
  return NextResponse.json(questions);
}
