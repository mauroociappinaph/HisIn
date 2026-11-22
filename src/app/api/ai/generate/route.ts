import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/modules/ai/guard";
import { generationRequestSchema } from "@/modules/ai/schema";
import { startGeneration } from "@/modules/ai/service";
import { getLocalUser } from "@/modules/identity/service";
import { ClassroomRepository } from "@/modules/classroom/repository";
import { contextPromptFragment } from "@/modules/classroom/design";

// Gentle Shell is a local CLI: this route needs a Node process that can spawn it.
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  if (!isAuthorized(req.headers)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = generationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Everything generated from the app inherits the learner's class context.
  const user = await getLocalUser();
  const design = await new ClassroomRepository().getDesign(user.id);
  const request = { ...parsed.data, context: parsed.data.context ?? contextPromptFragment(design) };

  const outcome = await startGeneration(request);
  if (!outcome.accepted) {
    return NextResponse.json(
      { error: "another generation is already running", jobId: outcome.runningJobId },
      { status: 429 },
    );
  }

  return NextResponse.json({ jobId: outcome.jobId, status: "PENDING" }, { status: 202 });
}
