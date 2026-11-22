import { z } from "zod";
import { CEFR_LEVELS } from "@/modules/ai/schema";
import { CONTENT_MODULES } from "@/modules/ai/schema";
import { ENTRY_KINDS, validateEntry, type EntryKind } from "./entry";

/**
 * One line in, a complete study entry out.
 *
 * The learner types what they met ("put up with", "make + object + verb",
 * "cut corners") and the engine does the filing: type, definition, example,
 * level, module and the grammar metadata each type needs. The reply is only
 * accepted if the same rules the manual form enforces also pass, so a lazy
 * extraction cannot enter the bank.
 */
export const entryAnalysisSchema = z.object({
  term: z.string().min(2).max(40),
  kind: z.enum(ENTRY_KINDS),
  definition: z.string().min(10).max(400),
  example: z.string().min(10).max(400),
  level: z.enum(CEFR_LEVELS),
  module: z.enum(CONTENT_MODULES),
  // Models return null for the fields that do not apply to the type; null and
  // absence mean the same thing here, so both are accepted and normalised away.
  particle: z.string().max(20).nullish(),
  separable: z.boolean().nullish(),
  register: z.enum(["neutral", "informal", "formal"]).nullish(),
  function: z.enum(["hedge", "soften", "persuade", "report", "compare", "express"]).nullish(),
  notes: z.string().max(400).nullish(),
});

export interface EntryAnalysis {
  term: string;
  kind: EntryKind;
  definition: string;
  example: string;
  level: (typeof CEFR_LEVELS)[number];
  module: (typeof CONTENT_MODULES)[number];
  particle?: string;
  separable?: boolean;
  register?: "neutral" | "informal" | "formal";
  function?: "hedge" | "soften" | "persuade" | "report" | "compare" | "express";
  notes?: string;
}

export const ENTRY_SYSTEM_PROMPT = [
  "You are an English teacher for Spanish-speaking healthtech founders and entrepreneurs.",
  "You receive one word, phrasal verb, idiom or sentence pattern and you return a complete study entry for it.",
  "Definitions and examples are in English. The learner-facing note is in Spanish.",
  "Return ONLY a JSON object. No prose, no markdown fences, no comments.",
].join(" ");

export function buildEntryPrompt(input: string, retryReason?: string): string {
  return [
    `Entry: ${JSON.stringify(input.trim())}`,
    'Return this shape: {"term","kind","definition","example","level","module","particle","separable","register","function","notes"}.',
    `kind must be exactly one of: ${ENTRY_KINDS.map((kind) => `"${kind}"`).join(", ")}.`,
    'WORD = one word. PHRASAL_VERB = verb + particle (put off, look after). IDIOM = fixed multiword expression whose meaning is not literal (cut corners, on the same page). PATTERN = sentence frame with slots (make + object + verb, is expected to + verb).',
    'term: the entry as it should be learned, lowercase unless it is a proper noun or an acronym. The term is yours to write: if the learner typed a fragment, return the complete entry — "interested in" comes back as "be interested in + noun/gerund", never as a bare fragment.',
    "definition: one or two English sentences a professional would accept, not a dictionary copy.",
    "example: one English sentence that USES the term (inflection is fine: 'pulled back' documents 'pull back'), set in healthtech, investors, contracts or product work.",
    `level: exactly one of ${CEFR_LEVELS.join(", ")}.`,
    `module: exactly one of ${CONTENT_MODULES.join(", ")} — the section it belongs to.`,
    'For PHRASAL_VERB: always send "particle" (the last word), "separable" (true/false) and "register" ("neutral" | "informal" | "formal").',
    'For PATTERN: the term MUST be the full frame with slots separated by +, for example "be interested in + noun/gerund", "make + object + verb", "is expected to + verb". A two-word fragment is not a PATTERN. Always send "function", exactly one of "hedge" (no comprometerse), "soften" (suavizar), "persuade" (empujar una decisión), "report" (atribuir lo que otro dijo), "compare" (medir dos cosas), "express" (declarar interés, necesidad o postura, como "be interested in").',
    'notes: in Spanish, the mistake a Spanish speaker makes with this entry.',
    retryReason
      ? `Your previous answer was rejected: ${retryReason}. Rewrite the entry so it passes every rule, especially the term shape for its kind.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export type EntryAnalysisResult =
  | { ok: true; analysis: EntryAnalysis; kind: EntryKind }
  | { ok: false; error: string };

/** Validates the model reply against the schema and the bank's own rules. */
export function parseEntryAnalysis(raw: string): EntryAnalysisResult {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return { ok: false, error: "la respuesta del motor no traía un objeto JSON" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return { ok: false, error: "la respuesta del motor no era JSON válido" };
  }

  const shape = entryAnalysisSchema.safeParse(parsed);
  if (!shape.success) {
    const issues = shape.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    return { ok: false, error: `la respuesta del motor no pasó la validación: ${issues}` };
  }

  // Nulls and absences mean the same thing for the optional metadata, so the
  // validated reply is flattened into a clean object before the bank sees it.
  const data = shape.data;
  const analysis: EntryAnalysis = {
    term: data.term,
    kind: data.kind,
    definition: data.definition,
    example: data.example,
    level: data.level,
    module: data.module,
    particle: data.particle ?? undefined,
    separable: data.separable ?? undefined,
    register: data.register ?? undefined,
    function: data.function ?? undefined,
    notes: data.notes ?? undefined,
  };

  const rules = validateEntry(analysis);
  if (!rules.ok) {
    return { ok: false, error: rules.errors.join("; ") };
  }

  return { ok: true, analysis, kind: analysis.kind };
}

/** Where an analysed entry is filed in the app. */
export function sectionFor(kind: EntryKind): { href: string; label: string } {
  switch (kind) {
    case "PHRASAL_VERB":
      return { href: "/phrasal-verbs", label: "Phrasal verbs" };
    case "IDIOM":
      return { href: "/phrasal-verbs?tipo=expresiones", label: "Expresiones" };
    case "PATTERN":
      return { href: "/patterns", label: "Patrones" };
    default:
      return { href: "/review/vocab", label: "Tu vocabulario" };
  }
}
