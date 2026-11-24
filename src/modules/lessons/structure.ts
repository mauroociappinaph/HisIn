/**
 * The one structure every lesson follows.
 *
 * A lesson is a text column in the database, so nothing stops one row from
 * being a glossary dump and another from being three loose sentences. This
 * module fixes the shape: five labelled sections in a stable order, one parser,
 * one canonicalizer. The seed, the AI schema, the prompt and the renderer all
 * read this list instead of repeating it.
 */
export const LESSON_SECTIONS = [
  {
    key: "goal",
    marker: "Goal",
    label: "Objetivo",
    purpose: "what the learner can do after this lesson, in one sentence",
  },
  {
    key: "learn",
    marker: "Learn",
    label: "Aprende",
    purpose: "the words, phrases or rules this lesson teaches",
  },
  {
    key: "examples",
    marker: "Examples",
    label: "Ejemplos",
    purpose: "two English sentences that show the lesson in use",
  },
  {
    key: "practice",
    marker: "Practice",
    label: "Práctica",
    purpose: "one task the learner can do today, on their own material",
  },
  {
    key: "mistake",
    marker: "Common mistake",
    label: "Error común",
    purpose: "the mistake a Spanish speaker makes here, and the fix",
  },
] as const;

export type LessonSectionKey = (typeof LESSON_SECTIONS)[number]["key"];

export interface LessonSection {
  key: LessonSectionKey;
  marker: string;
  label: string;
  purpose: string;
  body: string;
}

/**
 * The labels a section may be written with.
 *
 * Existing rows predate the template, so the parser accepts the labels they
 * already use ("Objetivo", "Key terms", a singular "Example"). A marker that is
 * not in this table is ordinary text, never a section.
 */
const SECTION_ALIASES: Record<string, LessonSectionKey> = {
  goal: "goal",
  objetivo: "goal",
  learn: "learn",
  aprende: "learn",
  "key terms": "learn",
  example: "examples",
  examples: "examples",
  ejemplos: "examples",
  practice: "practice",
  práctica: "practice",
  practica: "practice",
  mistake: "mistake",
  "common mistake": "mistake",
  "error típico": "mistake",
  "error común": "mistake",
  "error comun": "mistake",
};

const MARKER_LINE = /^[ \t]*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,20}?)[ \t]*:[ \t]*(.*)$/;

/**
 * Splits lesson content into the sections it actually declares, in canonical
 * order. Content with no recognisable marker returns an empty array, which is
 * the signal for the renderer to fall back to plain text.
 *
 * Prose written before the first marker is kept: it is prepended to the first
 * section present, so a legacy row loses nothing.
 */
export function parseLessonContent(content: string): LessonSection[] {
  const text = content.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const buckets = new Map<LessonSectionKey, string[]>();
  const preamble: string[] = [];
  let current: LessonSectionKey | null = null;

  for (const line of text.split("\n")) {
    const match = line.match(MARKER_LINE);
    const alias = match ? SECTION_ALIASES[(match[1] ?? "").trim().toLowerCase()] : undefined;

    if (match && alias) {
      current = alias;
      const rest = (match[2] ?? "").trim();
      const lines = buckets.get(alias) ?? [];
      if (rest) lines.push(rest);
      buckets.set(alias, lines);
      continue;
    }

    if (!current) {
      preamble.push(line);
      continue;
    }
    (buckets.get(current) ?? []).push(line);
  }

  if (buckets.size === 0) return [];

  const lead = preamble.join("\n").trim();
  let leadUsed = false;
  const sections: LessonSection[] = [];

  for (const spec of LESSON_SECTIONS) {
    const lines = buckets.get(spec.key);
    if (!lines) continue;
    let body = lines.join("\n").trim();
    if (!leadUsed && lead) {
      body = body ? `${lead}\n\n${body}` : lead;
      leadUsed = true;
    }
    if (body) sections.push({ ...spec, body });
  }

  return sections;
}

/**
 * Rewrites any lesson content into the canonical text form.
 *
 * Idempotent by construction: canonical input parses back into the same bodies,
 * so running it twice changes nothing. Content with no recognisable section is
 * returned trimmed but untouched - a normalizer must never delete a lesson it
 * could not understand.
 */
export function canonicalizeLessonContent(content: string): string {
  const sections = parseLessonContent(content);
  if (sections.length === 0) return content.trim();
  return sections.map((section) => `${section.marker}: ${section.body}`).join("\n\n");
}

/** True when the content declares every canonical section. */
export function isCompleteLessonContent(content: string): boolean {
  const present = new Set(parseLessonContent(content).map((section) => section.key));
  return LESSON_SECTIONS.every((section) => present.has(section.key));
}
