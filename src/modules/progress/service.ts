/**
 * Learner progress rules.
 *
 * These live outside the database and outside React so the streak, the daily
 * goal and the "what should I do now" decision can be tested as arithmetic
 * instead of being inferred from a screen.
 */
export interface ProgressState {
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null;
  itemsToday: number;
  totalItems: number;
  totalCorrect: number;
}

export interface ProgressEvent {
  xp?: number;
  items?: number;
  correct?: number;
}

/** Local calendar day, so "today" matches what the learner sees. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetween(from: string, to: string): number {
  const parse = (value: string) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  };
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

/**
 * Applies one practice event.
 *
 * A streak survives a same-day pause and continues from yesterday; any longer
 * gap starts a new run at one instead of silently keeping a dead number. The
 * daily counter resets when the calendar day changes, which is what makes the
 * daily goal honest.
 */
export function applyProgress(state: ProgressState, event: ProgressEvent, today: string): ProgressState {
  const sameDay = state.lastActiveDay === today;
  const gap = state.lastActiveDay === null ? Number.POSITIVE_INFINITY : daysBetween(state.lastActiveDay, today);
  const streak = sameDay ? state.streak : gap === 1 ? state.streak + 1 : 1;

  return {
    xp: state.xp + (event.xp ?? 0),
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    lastActiveDay: today,
    itemsToday: (sameDay ? state.itemsToday : 0) + (event.items ?? 0),
    totalItems: state.totalItems + (event.items ?? 0),
    totalCorrect: state.totalCorrect + (event.correct ?? 0),
  };
}

export type NextActionType = "review" | "story" | "lesson" | "practice" | "done";

export interface NextActionInput {
  dueReviews: number;
  itemsToday: number;
  dailyGoal: number;
  hasStory: boolean;
  nextLessonHref: string | null;
}

export interface NextAction {
  type: NextActionType;
  href: string;
  title: string;
  reason: string;
}

/**
 * One action, not a dashboard.
 *
 * The order is didactic: clear the review debt first (it decays), then read
 * something real, then learn something new. A finished goal still offers a next
 * step instead of a dead end.
 */
export function nextAction(input: NextActionInput): NextAction {
  if (input.dueReviews > 0) {
    return {
      type: "review",
      href: "/review/vocab",
      title: `Repasar ${input.dueReviews} ${input.dueReviews === 1 ? "palabra" : "palabras"}`,
      reason: "Si no las repasás hoy, el SM-2 las reprograma igual y se acumulan.",
    };
  }

  if (input.itemsToday < input.dailyGoal) {
    if (input.hasStory) {
      return {
        type: "story",
        href: "/review/vocab?modo=historias",
        title: "Leer una historia",
        reason: "Contexto real: es la forma más rápida de fijar lo que ya viste.",
      };
    }
    if (input.nextLessonHref) {
      return {
        type: "lesson",
        href: input.nextLessonHref,
        title: "Seguir con una lección",
        reason: "Tenés tiempo para algo nuevo antes de llegar a tu meta diaria.",
      };
    }
    return {
      type: "practice",
      href: "/learn",
      title: "Elegir un módulo",
      reason: "Todavía no hay lección pendiente para tu nivel: elegí un tema.",
    };
  }

  return {
    type: "done",
    href: "/review/vocab",
    title: "Meta cumplida",
    reason: "Podés cerrar acá o sumar una ronda corta: la práctica extra no se pierde.",
  };
}

export function goalRatio(itemsToday: number, dailyGoal: number): number {
  if (dailyGoal <= 0) return 1;
  return Math.max(0, Math.min(1, itemsToday / dailyGoal));
}
