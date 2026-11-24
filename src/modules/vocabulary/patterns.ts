import type { CefrLevel } from "@/shared/types";
import type { EntryFunction, EntryRegister } from "./entry";

/**
 * One pattern, explained the same way every time.
 *
 * A pattern is not a word: the learner needs what it means, why it is used, how
 * formal it is, two sentences that show it in context and the mistake a Spanish
 * speaker makes with it. This module is the only place that decides that order,
 * so the card, the form, the analyze path and a seeded pattern cannot drift.
 */
export type PatternSectionKey =
  | "definition"
  | "function"
  | "register"
  | "example"
  | "extraExample"
  | "notes";

export interface PatternSection {
  key: PatternSectionKey;
  label: string;
}

/** Canonical order of a pattern card. Append-only: readers depend on the order. */
export const PATTERN_SECTIONS: readonly PatternSection[] = [
  { key: "definition", label: "Qué significa" },
  { key: "function", label: "Para qué sirve" },
  { key: "register", label: "Registro" },
  { key: "example", label: "Ejemplo" },
  { key: "extraExample", label: "Segundo ejemplo" },
  { key: "notes", label: "Error típico" },
];

/** What each function does in a sentence, in the learner's terms. */
export const PATTERN_FUNCTION_MEANINGS: Record<string, string> = {
  hedge: "no comprometerse del todo (might, it seems)",
  soften: "suavizar algo incómodo o reconocer el trabajo de otro (I'm afraid, thanks for handling)",
  persuade: "empujar una decisión (make + objeto + verbo)",
  report: "contar lo que otro dijo o hizo (is said to, was reported)",
  compare: "medir dos cosas (twice as, compared with)",
  express: "declarar interés, necesidad o postura (be interested in, would like)",
};

export interface PatternSectionView {
  key: PatternSectionKey;
  label: string;
  value: string;
}

export interface PatternShape {
  definition?: string;
  function?: string;
  register?: string;
  example?: string;
  extraExample?: string;
  notes?: string;
}

function functionValue(fn: string): string {
  const meaning = PATTERN_FUNCTION_MEANINGS[fn];
  return meaning ? `${fn} — ${meaning}` : fn;
}

/**
 * The sections a specific entry can show, in canonical order.
 *
 * Absent values are skipped rather than rendered empty: a seeded pattern always
 * fills all of them, but a learner entry typed in a hurry may not, and an empty
 * "Segundo ejemplo" heading teaches nothing.
 */
export function patternSectionViews(entry: PatternShape): PatternSectionView[] {
  const values: Record<PatternSectionKey, string> = {
    definition: entry.definition?.trim() ?? "",
    function: entry.function?.trim() ? functionValue(entry.function.trim()) : "",
    register: entry.register?.trim() ?? "",
    example: entry.example?.trim() ?? "",
    extraExample: entry.extraExample?.trim() ?? "",
    notes: entry.notes?.trim() ?? "",
  };

  return PATTERN_SECTIONS.flatMap((section) => {
    const value = values[section.key];
    return value ? [{ key: section.key, label: section.label, value }] : [];
  });
}

/** A pattern that ships with the app, ready for the seed to upsert. */
export interface PatternSeed {
  term: string;
  definition: string;
  example: string;
  extraExample: string;
  notes: string;
  kind: "PATTERN";
  level: CefrLevel;
  module: string;
  function: EntryFunction;
  register: EntryRegister;
}

/**
 * Patterns seeded with the app.
 *
 * "Thanks for handling X" is filed under `soften` with a `neutral` register on
 * purpose: the closed function set has no "thank" value, and thanking a
 * colleague softens the exchange instead of persuading or reporting. Adding a
 * value would mean a migration, so the closest existing one is used.
 */
export const PATTERN_SEEDS: readonly PatternSeed[] = [
  {
    term: "Thanks for handling + noun/gerund",
    definition:
      "Fórmula para agradecer a alguien que se encargó de una tarea. Acá \"handle\" significa encargarse de algo o gestionarlo, no tolerarlo.",
    example: "Thanks for handling the research - the deck looks solid.",
    extraExample: "We handle projects end to end, from discovery to launch.",
    notes:
      "No confundas \"handle a task\" (encargarse) con \"handle the pressure\" (tolerar). Después de \"for\" va gerundio: \"Thanks for handling\", nunca \"Thanks for handle\".",
    kind: "PATTERN",
    level: "B1",
    module: "grammar",
    function: "soften",
    register: "neutral",
  },
];
