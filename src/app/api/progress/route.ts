import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocalUser } from "@/modules/identity/service";
import { ProgressRepository } from "@/modules/progress/repository";
import { CEFR_LEVELS, type CefrLevel } from "@/shared/types";

const eventSchema = z.object({
  event: z.enum(["practice", "review", "story", "lesson"]),
  items: z.number().int().min(0).max(200).default(0),
  correct: z.number().int().min(0).max(200).default(0),
  xp: z.number().int().min(0).max(1000).default(0),
  lessonId: z.string().min(1).max(120).optional(),
});

const onboardingSchema = z.object({
  goal: z.enum(["interviews", "investors", "clinical", "emails", "reading"]),
  dailyGoal: z.number().int().min(5).max(60),
  level: z.enum(CEFR_LEVELS as [CefrLevel, ...CefrLevel[]]).optional(),
});

export async function GET() {
  const user = await getLocalUser();
  const repository = new ProgressRepository();
  const [profile, completedLessonIds] = await Promise.all([
    repository.getProfile(user.id),
    repository.completedLessonIds(user.id),
  ]);
  return NextResponse.json({ profile, completedLessonIds });
}

/** Records one practice event; the profile, streak and daily goal all live here. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid event", issues: parsed.error.issues }, { status: 400 });
  }

  const user = await getLocalUser();
  const repository = new ProgressRepository();
  const profile = await repository.recordEvent(user.id, parsed.data);
  return NextResponse.json(profile);
}

/** Saves the one-screen onboarding: goal, daily rhythm and an optional level. */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid onboarding", issues: parsed.error.issues }, { status: 400 });
  }

  const user = await getLocalUser();
  const repository = new ProgressRepository();
  const profile = await repository.saveOnboarding(user.id, {
    goal: parsed.data.goal,
    dailyGoal: parsed.data.dailyGoal,
    level: parsed.data.level ?? "B1",
  });
  return NextResponse.json(profile);
}
