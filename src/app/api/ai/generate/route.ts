import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/modules/ai/guard";
import { questionRequestSchema } from "@/modules/ai/schema";
import { generateQuestions } from "@/modules/ai/service";

// Gentle Shell is a local CLI: this route needs a Node process that can spawn it.
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req.headers)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = questionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const outcome = await generateQuestions(parsed.data);
    return NextResponse.json(outcome, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "generation failed" },
      { status: 502 },
    );
  }
}
