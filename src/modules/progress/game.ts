/**
 * The game layer: levels and milestones.
 *
 * Kept as arithmetic so the UI can celebrate without inventing numbers. The curve
 * is gentle on purpose: the first levels arrive fast (a good first session), then
 * require real practice, and the level never goes down for a missed day.
 */
export interface LevelState {
  level: number;
  /** XP accumulated inside the current level. */
  into: number;
  /** XP the current level needs in total. */
  span: number;
  /** 0..1 progress inside the level. */
  ratio: number;
  /** XP still missing for the next level. */
  remaining: number;
}

const BASE = 60;
const STEP = 30;

/** XP required to complete level `level` (1-based). */
export function xpForLevel(level: number): number {
  const safe = Math.max(1, Math.trunc(level));
  return BASE + (safe - 1) * STEP;
}

export function levelFromXp(xp: number): LevelState {
  // NaN or a negative balance must not poison every derived number.
  let remainingXp = Number.isFinite(xp) ? Math.max(0, Math.trunc(xp)) : 0;
  let level = 1;
  let span = xpForLevel(level);

  while (remainingXp >= span && level < 200) {
    remainingXp -= span;
    level += 1;
    span = xpForLevel(level);
  }

  return {
    level,
    into: remainingXp,
    span,
    ratio: span === 0 ? 0 : remainingXp / span,
    remaining: span - remainingXp,
  };
}

export interface GameStats {
  xp: number;
  streak: number;
  bestStreak: number;
  itemsToday: number;
  dailyGoal: number;
  totalItems: number;
  lessonsDone: number;
  storiesRead: number;
}

export interface Milestone {
  id: string;
  label: string;
  detail: string;
  earned: boolean;
}

/**
 * Milestones are named for what the learner did, not for a number they hit:
 * "primera lección" celebrates starting, which is the hardest part.
 */
export function milestones(stats: GameStats): Milestone[] {
  return [
    {
      id: "first-lesson",
      label: "Arrancaste",
      detail: "Primera lección marcada como vista",
      earned: stats.lessonsDone >= 1,
    },
    {
      id: "first-streak",
      label: "Dos días seguidos",
      detail: "La racha empezó a moverse",
      earned: stats.bestStreak >= 2,
    },
    {
      id: "week-streak",
      label: "Semana completa",
      detail: "Siete días de racha",
      earned: stats.bestStreak >= 7,
    },
    {
      id: "hundred-cards",
      label: "100 tarjetas",
      detail: "Cien repasos hechos",
      earned: stats.totalItems >= 100,
    },
    {
      id: "first-story",
      label: "Primera historia",
      detail: "Leíste en contexto",
      earned: stats.storiesRead >= 1,
    },
    {
      id: "level-5",
      label: "Nivel 5",
      detail: "Sostenido en el tiempo",
      earned: levelFromXp(stats.xp).level >= 5,
    },
  ];
}

/** What the streak flame shows, and whether today still counts. */
export function streakState(stats: Pick<GameStats, "streak" | "itemsToday">): {
  active: boolean
  label: string;
} {
  const active = stats.itemsToday > 0;
  return {
    active,
    label: active ? `${stats.streak} ${stats.streak === 1 ? "día" : "días"}` : "hoy sin practicar",
  };
}
