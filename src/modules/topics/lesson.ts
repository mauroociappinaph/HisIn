/**
 * Turns a generated material into a lesson instead of a wall of text.
 *
 * The engine writes good prose but prose is not a lesson: a learner needs the
 * rule first, then examples they can see, then the mistake their own language
 * makes them commit, then practice. These helpers carve those pieces out of the
 * text the engine already wrote, so nothing is regenerated and nothing is
 * invented: every piece shown comes from the material itself.
 */
export interface LessonPart {
  /** Lead of the lesson: the rule in one paragraph. */
  idea: string;
  /** Remaining explanation, paragraph by paragraph. */
  body: string[];
  /** Examples the engine quoted, in the order they were written. */
  examples: string[];
  /** The sentence naming the Spanish-speaker error, when there is one. */
  trap: string | null;
}

const TRAP_MARKERS =
  /spanish[-\s]?speaker|hispanohablante|common mistake|typical error|frequent error|error común|confunden/i;

// Two characters minimum: at six, a short label like 'did' is skipped as an
// opening quote and the scanner then swallows the real example as an orphan.
const QUOTED = /'([^'\n]{2,140})'|“([^”\n]{2,140})”/g;

/** Words that appear in almost any English sentence and in almost no Spanish one. */
const ENGLISH_MARKER = /\b(the|to|of|in|on|for|with|is|are|was|were|have|has|had|we|you|they|this|that|not)\b/i;

/** A quote carrying Spanish letters or punctuation is the learner's language. */
const SPANISH_MARKER = /[\u00f1\u00e1\u00e9\u00ed\u00f3\u00fa\u00bf\u00a1]/i;

/**
 * Restores the punctuation spacing the engine sometimes drops.
 *
 * Stored materials come back as "The product good.Instead, say..." often enough
 * that it is worth a single pass: a missing space after a full stop is what makes
 * a text feel unreadable even when every word is right.
 */
export function normalizeSpacing(text: string): string {
  return text
    .replace(/([.!?;:])(?=[A-Za-zÁÉÍÓÚÑáéíóúñ¿¡])/g, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/**
 * Paragraphs to render, even when the stored text has none.
 *
 * 126 of 134 reading materials arrived as one single block: without this the page
 * shows a wall, no matter how good the prose is.
 */
export function toParagraphs(body: string, sentencesPerParagraph = 3): string[] {
  const normalized = normalizeSpacing(body);
  const explicit = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  if (explicit.length > 1) return explicit;

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(index, index + sentencesPerParagraph).join(" "));
  }
  return paragraphs.length > 0 ? paragraphs : [normalized];
}

export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/** The quoted fragments of a text, deduplicated, without the quotes. */
export function extractExamples(body: string): string[] {
  const found: string[] = [];
  for (const match of body.matchAll(QUOTED)) {
    const raw = match[1] ?? match[2] ?? "";
    const value = raw.trim();
    // A real quote sits snug against its quotation marks. An orphan span - the
    // text between the closing quote of one example and the opening quote of the
    // next - has whitespace or a colon where a sentence never has them.
    if (raw !== value || /:$/.test(value)) continue;
    // The engine quotes the learner's own language when it warns about a
    // translation error; that is not an English example to study.
    if (SPANISH_MARKER.test(value) || !ENGLISH_MARKER.test(value)) continue;
    // A one-word quote is a label, not an example sentence to study.
    if (value.split(/\s+/).length < 2) continue;
    if (found.some((example) => example.toLowerCase() === value.toLowerCase())) continue;
    found.push(value);
  }
  return found.slice(0, 8);
}

/**
 * The sentence that names the error a Spanish speaker makes.
 *
 * Cards that already carry the trap are the ones learners actually remember, so
 * it is pulled out of the paragraph rather than hidden inside it.
 */
export function findTrap(body: string): string | null {
  const sentences = body.split(/(?<=[.!?])\s+/);
  const trap = sentences.find((sentence) => TRAP_MARKERS.test(sentence));
  return trap ? trap.trim() : null;
}

/**
 * Splits a material into its parts.
 *
 * The first paragraph is the idea, the last one that is not the trap closes the
 * explanation, and the trap never appears twice: it is removed from the body.
 */
export function parseLesson(body: string): LessonPart {
  const paragraphs = splitParagraphs(body);
  const trap = findTrap(body);
  const bodyWithoutTrap = paragraphs
    .map((paragraph) => (trap ? paragraph.replace(trap, "").replace(/\s{2,}/g, " ").trim() : paragraph))
    .filter((paragraph) => paragraph.length > 0);

  return {
    idea: bodyWithoutTrap[0] ?? paragraphs[0] ?? "",
    body: bodyWithoutTrap.slice(1),
    examples: extractExamples(body),
    trap,
  };
}

/**
 * The structure of the rule, as segments to render as a formula.
 *
 * The engine writes it as a quoted template ("having + past participle"), so the
 * pieces are taken from the quotes it already wrote and never invented. Returns
 * an empty list when the material gives no such template.
 */
export function extractFormula(body: string, keyPoints: readonly string[] = []): string[] {
  const sources = [...keyPoints, body];
  for (const source of sources) {
    for (const match of source.matchAll(QUOTED)) {
      const value = (match[1] ?? match[2] ?? "").trim();
      if (!value.includes("+")) continue;
      const segments = value
        .split("+")
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0);
      if (segments.length >= 2 && segments.length <= 5) return segments;
    }
  }

  // The engine also writes the template without quotes: "have/has + past
  // participle". The digits and the grammar vocabulary keep this from turning
  // ordinary arithmetic or a date range into a formula.
  const GRAMMAR_WORD = /\b(have|has|had|be|been|verb|participle|ing|to|will|would|modal|subject|object|past|present|base|noun|adjective|pronoun)\b/i;
  for (const source of sources) {
    // Each side is a short run of plain words (letters, slash, hyphen), started at
    // a boundary: parentheses and punctuation end it, so "past participle) marks
    // recent" never becomes the right side.
    const match = source.match(
      /(?:^|[(,;:.]|\s)([a-z][a-z/\-]*(?:\s+[a-z][a-z/\-]*){0,3})\s*\+\s*([a-z][a-z/\-]*(?:\s+[a-z][a-z/\-]*){0,3})/i,
    );
    if (!match) continue;
    const left = match[1].trim().replace(/[\s]+/g, " ");
    const right = match[2].trim().replace(/[\s]+/g, " ").replace(/\s+(is|are|for|with|the)$/i, "");
    if (!GRAMMAR_WORD.test(left) && !GRAMMAR_WORD.test(right)) continue;
    if (left.split(/\s+/).length > 4 || right.split(/\s+/).length > 4) continue;
    return [left, right];
  }

  // An auxiliary lesson writes its structure in prose ("the main verb stays in the
  // base form"), so the two halves are taken from the words it uses when it names
  // an auxiliary and a base form.
  for (const source of sources) {
    if (/auxiliary/i.test(source) && /base form|base verb/i.test(source)) {
      return ["do / does", "base verb"];
    }
  }

  return [];
}

export interface Correction {
  wrong: string;
  right: string;
}

/**
 * The ✗/✓ pair hidden inside the trap sentence.
 *
 * The engine reports the error in a fixed shape: "saying 'I should improved'
 * instead of 'I should have improved'". Turning that into two rows is the
 * difference between reading about a mistake and seeing it corrected.
 */
export function pairCorrection(trap: string | null): Correction | null {
  if (!trap) return null;
  // Without a contrast marker the two quotes are just two correct sentences, and
  // painting one of them as an error teaches the opposite of the truth.
  if (!/instead of|rather than|en vez de|instead|incorrectly|wrongly/i.test(trap)) return null;
  const quotes = [...trap.matchAll(QUOTED)]
    .map((match) => (match[1] ?? match[2] ?? "").trim())
    .filter((value) => value.split(/\s+/).length >= 2);
  if (quotes.length < 2) return null;
  const [first, second] = quotes;
  return { wrong: first, right: second };
}

/**
 * The lead paragraph, broken into the points it actually makes.
 *
 * One 90-word block is not didactic: nobody learns from a wall. Each sentence
 * becomes a line, and the lines that carry an example are marked as such so the
 * page can put them where examples belong instead of burying them mid-text.
 */
export interface IdeaPoint {
  text: string;
  kind: "point" | "example";
}

export function splitIdea(idea: string, max = 6): IdeaPoint[] {
  // A quoted example ends with ?' or ." before the space, so the split has to
  // allow a closing quote between the punctuation and the whitespace.
  const sentences = idea
    .split(/(?<=[.!?])\s+|(?<=[.!?]['"”’])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return sentences.slice(0, max).map((sentence) => ({
    text: sentence,
    kind: /\b(e\.g\.|for example|for instance|such as|example:)/i.test(sentence) ? "example" : "point",
  }));
}

export type TimelineSpan = "past-point" | "past-to-now" | "now-forward" | "hypothetical";

/**
 * Where in time the structure of this lesson lives.
 *
 * A grammar rule about tense is a fact about time, and a picture of time says it
 * faster than a paragraph. Chosen from the title, so it is a claim about the topic
 * and never about a sentence the engine wrote.
 */
export function timelineFor(title: string): { span: TimelineSpan; caption: string } | null {
  const text = title.toLowerCase();
  const isPerfect = /perfect|conditional|wish|reported|inversion|passive|modal/.test(text);

  if (/present perfect continuous|present perfect/.test(text)) {
    return { span: "past-to-now", caption: "Empezó antes y sigue teniendo efecto ahora" };
  }
  if (/past perfect|past perfect continuous/.test(text)) {
    return { span: "past-point", caption: "Terminó antes de otro pasado" };
  }
  if (/past simple|past continuous|past of to be|used to|narration|narrativ/.test(text)) {
    return { span: "past-point", caption: "Punto cerrado en el pasado" };
  }
  if (/future|will|going to/.test(text)) {
    return { span: "now-forward", caption: "De ahora hacia adelante" };
  }
  if (/conditional|wish|if only|hypothetical/.test(text)) {
    return { span: "hypothetical", caption: "Un presente o pasado que no es el real" };
  }
  if (isPerfect) {
    return { span: "past-to-now", caption: "Un pasado que todavía se mira desde el presente" };
  }
  return null;
}

/** Reading time at a comfortable 200 words per minute, rounded up. */
export function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function wordCount(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * The objectives shown at the top of a lesson: the material's own key points.
 *
 * Turning them into "by the end you can X" would mean rewriting them, and the
 * engine already wrote them as actions.
 */
export function objectivesFor(keyPoints: readonly string[]): string[] {
  return keyPoints.slice(0, 4);
}
