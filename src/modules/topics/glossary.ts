import { z } from "zod";

/**
 * The glossary that makes a story readable without a dictionary tab.
 *
 * Two jobs in one list: the Spanish translation of the words that matter, and the
 * multi-word units the text actually uses. A phrasal verb is a single unit of
 * meaning, so it is glossed as one entry and rendered as one clickable phrase
 * instead of three unrelated words.
 */
export const GLOSS_KINDS = ["word", "phrasal_verb", "pattern", "idiom", "collocation"] as const;
export type GlossKind = (typeof GLOSS_KINDS)[number];

export const GLOSS_KIND_LABELS: Record<GlossKind, string> = {
  word: "palabra",
  phrasal_verb: "phrasal verb",
  pattern: "patrón",
  idiom: "expresión",
  collocation: "colocación",
};

const entryShape = z.object({
  term: z.string().trim().min(2).max(60),
  translation: z.string().trim().min(2).max(80),
  kind: z.enum(GLOSS_KINDS),
  note: z.string().trim().min(3).max(140).optional(),
});

export const storyGlossarySchema = z.object({
  entries: z.array(entryShape).min(8).max(40),
});

export type StoryGlossary = z.infer<typeof storyGlossarySchema>;
export type GlossEntry = StoryGlossary["entries"][number];

export const GLOSSARY_SYSTEM_PROMPT = [
  "You are an English teacher for Spanish-speaking healthtech founders.",
  "You annotate a story so a Spanish speaker can read it without leaving the page.",
  "Translations are Spanish from Argentina, short and idiomatic, never word by word.",
  "A multi-word unit (phrasal verb, pattern, idiom, collocation) is one entry, never split into separate words.",
  "Return ONLY a JSON object. No prose, no markdown fences.",
].join(" ");

export function buildGlossaryPrompt(input: { title: string; body: string; level: string }): string {
  return [
    `Story title: ${JSON.stringify(input.title)}`,
    `CEFR level: ${input.level}.`,
    `Story: ${JSON.stringify(input.body.slice(0, 1800))}`,
    'Return {"entries":[{"term","translation","kind","note"}]}.',
    "Include every word in the story that a Spanish-speaking founder at this level would have to look up, 12 to 30 entries.",
    'Use "word" for single words, "phrasal_verb" for verbs with a particle (turn off, run into, put up with), "pattern" for fixed frames (used to, be about to, as soon as), "collocation" for natural pairs (make a decision, heavy rain), "idiom" for figurative expressions.',
    '"term" must appear literally in the story, in its inflected form as written.',
    '"translation" is a short Spanish equivalent, not a definition.',
    '"note" is optional: one short Spanish clarification, or the formal alternative of a phrasal verb.',
  ].join(" ");
}

/** Accepts the raw engine reply; rejects anything that would render badly. */
export function parseGlossary(raw: string): StoryGlossary {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("la respuesta del motor no traía un objeto JSON");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("la respuesta del motor no era JSON válido");
  }
  const result = storyGlossarySchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`el glosario no pasó la validación: ${issues}`);
  }
  // The engine sometimes returns the term with the story's trailing comma or
  // period still attached ("until dawn."). Rendered as-is it produces a chip that
  // looks like a sentence, so the punctuation is stripped here, once.
  const normalized: GlossEntry[] = result.data.entries
    .map((entry) => ({
      ...entry,
      term: entry.term.replace(/^[^A-Za-z]+/, "").replace(/[^A-Za-z]+$/, "").replace(/\s+/g, " ").trim(),
    }))
    .filter((entry) => entry.term.length >= 2 && entry.term.split(" ").length <= 5);
  return { entries: dedupe(normalized.length >= 8 ? normalized : result.data.entries) };
}

/**
 * The same term twice would render twice and show two translations, so the first
 * one wins: the engine repeats a term when it appears in several forms.
 */
function dedupe(entries: GlossEntry[]): GlossEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.term.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface GlossLookup {
  /** Every glossed term, longest first, so "put up with" wins over "put". */
  phrases: { term: string; words: number; entry: GlossEntry }[];
  byTerm: Map<string, GlossEntry>;
  /** Highest word count present, to cap the n-gram search. */
  maxWords: number;
}

export function buildLookup(entries: GlossEntry[]): GlossLookup {
  const byTerm = new Map<string, GlossEntry>();
  for (const entry of entries) byTerm.set(entry.term.toLowerCase(), entry);
  const phrases = entries
    .map((entry) => ({ term: entry.term.toLowerCase(), words: entry.term.trim().split(/\s+/).length, entry }))
    .sort((a, b) => b.words - a.words);
  const maxWords = phrases.reduce((max, phrase) => Math.max(max, phrase.words), 1);
  return { phrases, byTerm, maxWords: Math.min(maxWords, 5) };
}

export interface Token {
  text: string;
  /** Set when the token is a glossed unit (one word or a whole phrase). */
  entry?: GlossEntry;
}

/**
 * Splits the story into tokens, joining multi-word glossed units into one token.
 *
 * Matching is done on the text as written, so "ran into" matches the gloss for
 * "run into" through the engine's own inflected form, never through a stemmer we
 * would have to keep in sync.
 */
export function tokenizeStory(body: string, lookup: GlossLookup): Token[] {
  const chunks = body.split(/(\s+)/).filter((chunk) => chunk.length > 0);
  const raw = chunks.map((chunk) => chunk.replace(/[^A-Za-z'’-]/g, ""));
  const tokens: Token[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (/^\s+$/.test(chunk)) {
      tokens.push({ text: chunk });
      continue;
    }

    let matched = false;
    for (let words = lookup.maxWords; words >= 2 && !matched; words -= 1) {
      const span = index + words * 2 - 2;
      if (span >= chunks.length) continue;
      const slice = chunks.slice(index, span + 1);
      // A phrase span must alternate word, space, word: without this check a span
      // that lands on a separator would be compared as if it were words.
      const alternates = slice.every((part, offset) =>
        offset % 2 === 0 ? !/^\s+$/.test(part) : /^\s+$/.test(part),
      );
      if (!alternates) continue;
      const candidate = slice
        .filter((_, offset) => offset % 2 === 0)
        .map((part) => part.replace(/[^A-Za-z'’-]/g, ""))
        .join(" ")
        .toLowerCase();
      const entry = lookup.byTerm.get(candidate);
      if (!entry) continue;
      tokens.push({ text: slice.join(""), entry });
      index = span;
      matched = true;
    }
    if (matched) continue;

    const single = lookup.byTerm.get(raw[index].toLowerCase());
    tokens.push({ text: chunk, entry: single });
  }

  return tokens;
}

/** True when the token can be glossed or saved: it contains letters and is not a space. */
export function isWordToken(token: Token): boolean {
  return /[A-Za-z]/.test(token.text) && !/^\s+$/.test(token.text);
}
