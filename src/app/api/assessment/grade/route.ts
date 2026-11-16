import { NextRequest, NextResponse } from "next/server";
import { AssessmentService } from "@/modules/assessment/service";
import type { AnswerInput } from "@/modules/assessment/service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const answers: AnswerInput[] = body.answers ?? [];
  const service = new AssessmentService();
  const result = await service.grade(answers);
  return NextResponse.json(result);
}
