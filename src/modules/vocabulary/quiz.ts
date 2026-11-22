import type { CefrLevel } from "@/shared/types";

/**
 * Game layer of the vocabulary trainer.
 *
 * The SRS decides *when* a word is due; this module decides *how* it is asked.
 * Everything here is pure so the review page stays a thin shell over testable
 * rules: cloze extraction, option sampling and scoring.
 */
export interface QuizItem {
  id: string;
  term: string;
  definition: string;
  example: string;
  module: string;
  level: CefrLevel;
}

export interface QuizOption {
  id: string;
  term: string;
}

export interface QuizQuestion {
  vocabularyId: string;
  kind: "cloze" | "definition";
  /** The sentence with the term hidden, or the definition when no example uses the term. */
  prompt: string;
  answer: string;
  options: QuizOption[];
  /** Full example, revealed after answering, so the learner sees the word in context. */
  context: string;
}

export interface ScoreState {
  xp: number;
  streak: number;
  best: number;
}

export interface ScoreResult {
  state: ScoreState;
  gained: number;
}

const XO_OPTIONS = 4;
const XP_BASE = 10;
const XP_PER_STREAK_LEVEL = 2;
const STREAK_BONUS_CAP = 5;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces every whole-word occurrence of `term` with a blank.
 * Returns null when the sentence never uses the word, which is the signal to
 * fall back to a definition prompt instead of shipping a cloze with no blank.
 */
export function buildCloze(example: string, term: string): string | null {
  const trimmed = term.trim();
  if (!trimmed) return null;

  const pattern = trimmed.split(/\s+/).map(escapeRegExp).join("\\s+");
  const matcher = new RegExp(`(?<![\\w-])${pattern}(?![\\w-])`, "gi");
  if (!matcher.test(example)) return null;

  return example.replace(matcher, "___");
}

/**
 * Small seeded PRNG (mulberry32) so a round is reproducible from its number:
 * "otra ronda" changes the seed, never the rules.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: readonly T[], rng: () => number): T[] {
  const out = [...values];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [out[index], out[swap]] = [out[swap], out[index]];
  }
  return out;
}

function buildOptions(item: QuizItem, pool: readonly QuizItem[], rng: () => number): QuizOption[] {
  const seen = new Set([item.term.toLowerCase()]);
  const distractors: QuizOption[] = [];

  for (const candidate of shuffle(pool, rng)) {
    const key = candidate.term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push({ id: candidate.id, term: candidate.term });
    if (distractors.length === XO_OPTIONS - 1) break;
  }

  return shuffle([{ id: item.id, term: item.term }, ...distractors], rng);
}

function buildQuestion(item: QuizItem, pool: readonly QuizItem[], rng: () => number): QuizQuestion {
  const cloze = buildCloze(item.example, item.term);
  return {
    vocabularyId: item.id,
    kind: cloze ? "cloze" : "definition",
    prompt: cloze ?? item.definition,
    answer: item.term,
    options: buildOptions(item, pool, rng),
    context: item.example,
  };
}

/**
 * Builds one round. A round can be longer than the pool, in which case words
 * repeat in a shuffled order instead of the round silently shrinking.
 */
export function buildRound(
  items: readonly QuizItem[],
  options: { count?: number; rng?: () => number } = {},
): QuizQuestion[] {
  const count = Math.max(1, Math.trunc(options.count ?? 10));
  const rng = options.rng ?? Math.random;
  if (items.length === 0) return [];

  const questions: QuizQuestion[] = [];
  let deck: QuizItem[] = [];

  while (questions.length < count) {
    if (deck.length === 0) deck = shuffle(items, rng);
    const item = deck.pop();
    if (!item) break;
    questions.push(buildQuestion(item, items, rng));
  }

  return questions;
}

/**
 * XP rewards accuracy up front and consistency after it: every streak level
 * adds two points up to five levels, so a long run is worth more than the same
 * number of isolated hits, and a miss resets the run without deleting progress.
 */
export function scoreAnswer(state: ScoreState, correct: boolean): ScoreResult {
  if (!correct) {
    return { gained: 0, state: { xp: state.xp, streak: 0, best: state.best } };
  }

  const gained = XP_BASE + XP_PER_STREAK_LEVEL * Math.min(state.streak, STREAK_BONUS_CAP);
  const streak = state.streak + 1;

  return { gained, state: { xp: state.xp + gained, streak, best: Math.max(state.best, streak) } };
}
