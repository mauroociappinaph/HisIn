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

/**
 * Same notion of "used", but the first word may inflect.
 *
 * News text says "funds pulled back", not "pull back": requiring the dictionary
 * form would reject correct extractions. The head verb may take -s/-ed/-ing while
 * the particle stays a whole word.
 */
export function usesInflectedTerm(text: string, term: string): boolean {
  const tokens = term.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  if (tokens.length === 1) return usesTerm(text, term);

  const [head, ...rest] = tokens as [string, ...string[]];
  const pattern = [escapeRegExp(head) + "\\w*", ...rest.map((token) => escapeRegExp(token))].join("\\s+");
  return new RegExp(`(?<![\\w-])${pattern}(?![\\w-])`, "i").test(text);
}
