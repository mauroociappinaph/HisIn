import { NextResponse } from "next/server";
import { AssessmentService } from "@/modules/assessment/service";

export async function GET() {
  const service = new AssessmentService();
  const questions = await service.getTestQuestions(30);
  return NextResponse.json(questions);
}
