import { prisma } from "@/shared/db/prisma";
import type { CefrLevel } from "@/shared/types";
import { applyProgress, dayKey, type ProgressEvent, type ProgressState } from "./service";

export interface ProfileClassDesign {
  discipline: string;
  educationLevel: string;
  educationMix?: Record<string, number> | null;
  minutes: number;
  sequence: string;
}

export interface ProfileDTO {
  level: CefrLevel;
  goal: string;
  dailyGoal: number;
  xp: number;
  streak: number;
  bestStreak: number;
  itemsToday: number;
  totalItems: number;
  totalCorrect: number;
  onboarded: boolean;
  classDesign: ProfileClassDesign;
}

function toState(row: {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  itemsToday: number;
  totalItems: number;
  totalCorrect: number;
}): ProgressState {
  return {
    xp: row.xp,
    streak: row.streak,
    bestStreak: row.bestStreak,
    lastActiveDay: row.lastActiveDay,
    itemsToday: row.itemsToday,
    totalItems: row.totalItems,
    totalCorrect: row.totalCorrect,
  };
}

export class ProgressRepository {
  /**
   * Just the two numbers the shell prints.
   *
   * The full profile computes "items today" with `new Date()`, which is unstable
   * at prerender time and broke the build of static routes. The header does not
   * need that value, so it does not ask for it.
   */
  async getShellCounters(userId: string): Promise<{
    streak: number;
    xp: number;
    discipline: string;
    educationLevel: string;
    minutes: number;
  }> {
    const row = await prisma.learnerProfile.findUnique({
      where: { userId },
      select: { streak: true, xp: true, discipline: true, educationLevel: true, classMinutes: true },
    });
    return {
      streak: row?.streak ?? 0,
      xp: row?.xp ?? 0,
      discipline: row?.discipline ?? "negocios",
      educationLevel: row?.educationLevel ?? "grado_inicial",
      minutes: row?.classMinutes ?? 60,
    };
  }

  /** One profile per learner, created on first read so onboarding never 500s. */
  async getProfile(userId: string): Promise<ProfileDTO> {
    const row = await prisma.learnerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return {
      level: row.level as CefrLevel,
      goal: row.goal,
      dailyGoal: row.dailyGoal,
      xp: row.xp,
      streak: row.streak,
      bestStreak: row.bestStreak,
      itemsToday: row.lastActiveDay === dayKey(new Date()) ? row.itemsToday : 0,
      totalItems: row.totalItems,
      totalCorrect: row.totalCorrect,
      onboarded: row.onboardedAt !== null,
      classDesign: {
        discipline: row.discipline,
        educationLevel: row.educationLevel,
        educationMix: (row.educationMix as Record<string, number> | null) ?? null,
        minutes: row.classMinutes,
        sequence: row.sequence,
      },
    };
  }

  async saveOnboarding(
    userId: string,
    input: { goal: string; dailyGoal: number; level: CefrLevel },
  ): Promise<ProfileDTO> {
    await prisma.learnerProfile.upsert({
      where: { userId },
      update: { ...input, onboardedAt: new Date() },
      create: { userId, ...input, onboardedAt: new Date() },
    });
    return this.getProfile(userId);
  }

  async recordEvent(userId: string, event: ProgressEvent & { lessonId?: string }): Promise<ProfileDTO> {
    const current = await prisma.learnerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const next = applyProgress(toState(current), event, dayKey(new Date()));

    await prisma.learnerProfile.update({
      where: { userId },
      data: {
        xp: next.xp,
        streak: next.streak,
        bestStreak: next.bestStreak,
        lastActiveDay: next.lastActiveDay,
        itemsToday: next.itemsToday,
        totalItems: next.totalItems,
        totalCorrect: next.totalCorrect,
      },
    });

    if (event.lessonId) {
      await prisma.lessonCompletion.upsert({
        where: { userId_lessonId: { userId, lessonId: event.lessonId } },
        update: {},
        create: { userId, lessonId: event.lessonId },
      });
    }

    return this.getProfile(userId);
  }

  async completedLessonIds(userId: string): Promise<string[]> {
    const rows = await prisma.lessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true },
    });
    return rows.map((row) => row.lessonId);
  }
}
