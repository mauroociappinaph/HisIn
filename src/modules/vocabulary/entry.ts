import { CEFR_LEVELS, type CefrLevel } from "@/shared/types";
import { usesInflectedTerm, usesTerm } from "@/shared/lib/text";

/**
 * The three shapes one entry of the vocabulary bank can take.
 *
 * They share one review pipeline on purpose: a phrasal verb and a sentence
 * pattern are recalled exactly like a word, only their prompts differ.
 */
export const ENTRY_KINDS = ["WORD", "PHRASAL_VERB", "PATTERN", "IDIOM"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

/**
 * Words that can close a phrasal verb. Prepositional verbs ("look after") are
 * part of the family for a Spanish-speaking learner, so they are accepted too.
 */
export const PARTICLES = [
  "about",
  "across",
  "after",
  "against",
  "along",
  "apart",
  "around",
  "at",
  "away",
  "back",
  "by",
  "down",
  "for",
  "from",
  "in",
  "into",
  "of",
  "off",
  "on",
  "out",
  "over",
  "through",
  "to",
  "up",
  "upon",
  "with",
] as const;

/**
 * Words that name a slot in a pattern. A learner without metalinguistic habit
 * writes "make + object + verb" or "make sb do sth"; both must pass.
 */
export const SLOT_WORDS = [
  "sb",
  "sth",
  "somebody",
  "something",
  "object",
  "verb",
  "gerund",
  "infinitive",
  "adjective",
  "noun",
  "clause",
] as const;

export interface EntryDraft {
  term: string;
  definition: string;
  example: string;
  kind: EntryKind;
  level: CefrLevel;
  module: string;
  extraExample?: string;
  notes?: string;
}

export type EntryValidation =
  | { ok: true; particle: string | null; term: string }
  | { ok: false; errors: string[] };

const MIN_TEXT = 10;
const MAX_TEXT = 400;

function words(term: string): string[] {
  return term.trim().split(/\s+/).filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validates a learner-written entry before it reaches the bank.
 *
 * The rules exist so a saved entry is actually reviewable later: a single word
 * cannot contain spaces, a phrasal verb must end in a real particle (otherwise
 * the learner is guessing at what they added), a pattern must show its slots,
 * and an example must use the entry it documents - the same rule the story
 * generator follows for its target words.
 */
export function validateEntry(draft: EntryDraft): EntryValidation {
  const errors: string[] = [];
  const term = draft.term.trim();
  const tokens = words(term);

  if (term.length < 2 || term.length > 40) {
    errors.push("el término debe tener entre 2 y 40 caracteres");
  }
  if (draft.definition.trim().length < MIN_TEXT || draft.definition.trim().length > MAX_TEXT) {
    errors.push(`la definición debe tener entre ${MIN_TEXT} y ${MAX_TEXT} caracteres`);
  }
  if (draft.example.trim().length < MIN_TEXT || draft.example.trim().length > MAX_TEXT) {
    errors.push(`el ejemplo debe tener entre ${MIN_TEXT} y ${MAX_TEXT} caracteres`);
  }
  if (!CEFR_LEVELS.includes(draft.level)) {
    errors.push(`el nivel debe ser uno de ${CEFR_LEVELS.join(", ")}`);
  }

  let particle: string | null = null;

  if (draft.kind === "WORD") {
    if (tokens.length > 1) {
      errors.push(`una palabra sola no lleva espacios: "${term}"`);
    }
  }

  if (draft.kind === "PHRASAL_VERB") {
    if (tokens.length < 2) {
      errors.push(`un phrasal verb necesita verbo y partícula: "${term}"`);
    } else {
      const candidate = tokens[tokens.length - 1]?.toLowerCase() ?? "";
      if (!(PARTICLES as readonly string[]).includes(candidate)) {
        errors.push(`"${tokens[tokens.length - 1]}" no es una partícula`);
      } else {
        particle = candidate;
      }
    }
  }

  if (draft.kind === "IDIOM") {
    if (tokens.length < 2) {
      errors.push(`una expresión necesita al menos dos palabras: "${term}"`);
    }
  }

  if (draft.kind === "PATTERN") {
    const hasSlotWord = tokens.some((token) => (SLOT_WORDS as readonly string[]).includes(token));
    if (!term.includes("+") && !hasSlotWord) {
      errors.push(
        `un patrón necesita slots, por ejemplo "make + object + verb" o "make sb do sth": "${term}"`,
      );
    }
  }

  // A pattern documents a structure, so its example cannot repeat the slots
  // literally. A word must appear whole; a phrasal verb may inflect, so its verb
  // stem is matched as a prefix and its particle as a whole word.
  if (draft.kind === "WORD" && tokens.length > 0 && draft.example.trim().length > 0) {
    if (!usesTerm(draft.example, term)) {
      errors.push(`el ejemplo tiene que usar "${term}"`);
    }
  }

  if (draft.kind === "IDIOM" && tokens.length >= 2 && draft.example.trim().length > 0) {
    if (!usesInflectedTerm(draft.example, term)) {
      errors.push(`el ejemplo tiene que usar "${term}"`);
    }
  }

  if (draft.kind === "PHRASAL_VERB" && tokens.length >= 2 && draft.example.trim().length > 0) {
    const verbStem = tokens[0] ?? "";
    const particleWord = tokens[tokens.length - 1] ?? "";
    const inflected = new RegExp(`(?<![\\w-])${escapeRegExp(verbStem)}\\w*(?![\\w-])`, "i");
    if (!usesTerm(draft.example, particleWord) || !inflected.test(draft.example)) {
      errors.push(`el ejemplo tiene que usar "${term}"`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    term,
    particle: draft.kind === "PHRASAL_VERB" ? particle : null,
  };
}
