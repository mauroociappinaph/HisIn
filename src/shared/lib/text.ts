function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word, case-insensitive, multiword-aware "is this term used?" test.
 *
 * Shared by the content engine (a story must use its declared target words) and
 * by the vocabulary bank (a learner's example must use the entry it documents),
 * so both enforce the same notion of "used" instead of drifting apart.
 */
export function usesTerm(text: string, term: string): boolean {
  const trimmed = term.trim();
  if (!trimmed) return false;
  const pattern = trimmed.split(/\s+/).map(escapeRegExp).join("\\s+");
  return new RegExp(`(?<![\\w-])${pattern}(?![\\w-])`, "i").test(text);
}
