"use client";

import type { ScoreState } from "@/modules/vocabulary/quiz";

/**
 * Browser-local trainer state: XP/streak and the "I know this one" marks.
 *
 * SRS scheduling is the source of truth in Postgres; these are personal
 * counters, so they live in localStorage behind one external store. That keeps
 * the page free of state-setting effects (and gains cross-tab sync for free).
 */
const SCORE_KEY = "hisin:vocab-score";
const KNOWN_KEY = "hisin:vocab-known";

export interface TrainerSnapshot {
  score: ScoreState;
  known: string[];
}

const EMPTY: TrainerSnapshot = { score: { xp: 0, streak: 0, best: 0 }, known: [] };

let cache: TrainerSnapshot | null = null;
const listeners = new Set<() => void>();

function read(): TrainerSnapshot {
  if (typeof window === "undefined") return EMPTY;
  try {
    const rawScore = window.localStorage.getItem(SCORE_KEY);
    const rawKnown = window.localStorage.getItem(KNOWN_KEY);
    const parsed = rawScore ? (JSON.parse(rawScore) as Partial<ScoreState>) : {};
    const known = rawKnown ? (JSON.parse(rawKnown) as string[]) : [];
    return {
      score: {
        // The streak is session-scoped: reopening the app starts a fresh run.
        xp: Number(parsed.xp) || 0,
        streak: 0,
        best: Number(parsed.best) || 0,
      },
      known: Array.isArray(known) ? known : [],
    };
  } catch {
    return EMPTY;
  }
}

function write(next: TrainerSnapshot) {
  cache = next;
  try {
    window.localStorage.setItem(SCORE_KEY, JSON.stringify(next.score));
    window.localStorage.setItem(KNOWN_KEY, JSON.stringify(next.known));
  } catch {
    // Private mode can reject writes; the in-memory store still works.
  }
  for (const listener of listeners) listener();
}

export function subscribeTrainer(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTrainerSnapshot(): TrainerSnapshot {
  cache ??= read();
  return cache;
}

export function getTrainerServerSnapshot(): TrainerSnapshot {
  return EMPTY;
}

export function saveScore(score: ScoreState) {
  write({ ...getTrainerSnapshot(), score });
}

export function toggleKnown(id: string) {
  const current = getTrainerSnapshot();
  const known = current.known.includes(id)
    ? current.known.filter((value) => value !== id)
    : [...current.known, id];
  write({ ...current, known });
}
