import { CEFR_LEVELS, type CefrLevel } from "@/shared/types";

/**
 * FNV-1a hash of a string, as a 32-bit unsigned integer. Used to derive a
 * stable shuffle seed from a question id, so the presentation order never
 * changes between renders for the same question.
 */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministic PRNG (mulberry32) seeded from an id-derived hash.
 */
function createIdRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Presents a question's options in a stable, id-derived shuffled order.
 * Never mutates the stored array; keeps every option exactly once so scoring
 * can still compare the chosen string against the stored answer by value.
 */
export function presentOptions(
  question: { id: string; options: string[] },
  rng?: () => number,
): string[] {
  const options = question.options;
  if (options.length < 2) return [...options];

  const presented = [...options];
  const next = rng ?? createIdRng(fnv1a(question.id));
  for (let i = presented.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [presented[i], presented[j]] = [presented[j], presented[i]];
  }
  return presented;
}

/**
 * Resolves the CEFR level to actually use: an exact match wins, otherwise the
 * nearest available level below the target, otherwise the nearest above.
 * An empty catalogue cannot serve any level and yields null.
 */
export function resolveLevel(target: CefrLevel, available: readonly CefrLevel[]): CefrLevel | null {
  if (available.length === 0) return null;
  const order = (level: CefrLevel) => CEFR_LEVELS.indexOf(level);
  const targetOrder = order(target);
  if (available.some((level) => level === target)) return target;

  const below = available.filter((level) => order(level) < targetOrder);
  if (below.length > 0) {
    return below.reduce((best, level) => (order(level) > order(best) ? level : best));
  }
  const above = available.filter((level) => order(level) > targetOrder);
  return above.reduce((best, level) => (order(level) < order(best) ? level : best));
}
