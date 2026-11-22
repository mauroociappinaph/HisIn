/**
 * Pure highlight layer for story reading.
 *
 * Splits a story body into matched and unmatched segments without ever
 * rebuilding the text from the terms: the body is scanned once and every
 * character is emitted as-is, so the original casing and spacing survive.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildAlternation(terms: readonly string[]): string {
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const term of terms) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(trimmed);
  }

  // Alternation resolves to the first matching branch, so longer terms must
  // come first to win against their overlapping prefixes ("put off" > "put").
  return candidates
    .sort((a, b) => b.length - a.length)
    .map((term) => term.split(/\s+/).map(escapeRegExp).join("\\s+"))
    .join("|");
}

/**
 * Splits `body` into segments, marking whole-word matches of any term.
 * Matching is case-insensitive; multiword terms tolerate different internal
 * whitespace. With no usable term it returns the body as one unmatched segment.
 */
export function highlightTerms(body: string, terms: readonly string[]): HighlightSegment[] {
  const alternation = buildAlternation(terms);
  if (!alternation) return [{ text: body, match: false }];

  const matcher = new RegExp(`(?<![\\w-])(${alternation})(?![\\w-])`, "gi");

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const match of body.matchAll(matcher)) {
    const index = match.index;
    if (index > cursor) segments.push({ text: body.slice(cursor, index), match: false });
    segments.push({ text: match[0], match: true });
    cursor = index + match[0].length;
  }

  if (cursor < body.length) segments.push({ text: body.slice(cursor), match: false });
  if (segments.length === 0) return [{ text: body, match: false }];

  return segments;
}
