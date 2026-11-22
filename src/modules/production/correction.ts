import { z } from "zod";

/**
 * What comes back when the learner sends a real email.
 *
 * Five criteria, one corrected version and a list of changes. Every change says
 * what was wrong, how to say it, why, and which lesson explains the rule, so the
 * correction is a route back into the syllabus instead of a red pen.
 */
export const MISTAKE_KINDS = ["grammar", "vocabulary", "register", "cohesion", "spelling"] as const;
export type MistakeKind = (typeof MISTAKE_KINDS)[number];

export const MISTAKE_KIND_LABELS: Record<MistakeKind, string> = {
  grammar: "grammar",
  vocabulary: "vocabulary",
  register: "register",
  cohesion: "cohesion",
  spelling: "spelling",
};

const changeShape = z.object({
  kind: z.enum(MISTAKE_KINDS),
  original: z.string().trim().min(2).max(300),
  corrected: z.string().trim().min(1).max(300),
  why: z.string().trim().min(8).max(300),
  topicSlug: z.string().trim().max(120).optional(),
});

export const correctionSchema = z.object({
  corrected: z.string().trim().min(20).max(4000),
  summary: z.string().trim().min(10).max(400),
  register: z.enum(["too-informal", "right", "too-formal"]),
  scores: z.object({
    grammar: z.number().int().min(1).max(5),
    vocabulary: z.number().int().min(1).max(5),
    register: z.number().int().min(1).max(5),
    cohesion: z.number().int().min(1).max(5),
  }),
  changes: z.array(changeShape).max(20),
});

export type Correction = z.infer<typeof correctionSchema>;

export const CORRECTION_SYSTEM_PROMPT = [
  "You correct English written by Spanish-speaking healthtech founders.",
  "You fix what is wrong and you leave what is right alone: no rewriting for taste.",
  "Every change you report must be visible in the original text.",
  "Return ONLY a JSON object. No prose, no markdown fences.",
].join(" ");

export function buildCorrectionPrompt(input: {
  email: string;
  level: string;
  audience?: string;
  topics: { slug: string; title: string }[];
}): string {
  const lessons = input.topics.slice(0, 120).map((topic) => `${topic.slug}=${topic.title}`).join("; ");
  return [
    `Learner CEFR level: ${input.level}.`,
    input.audience ? `Audience: ${JSON.stringify(input.audience)}.` : "",
    `Email to correct: ${JSON.stringify(input.email)}`,
    'Return {"corrected","summary","register","scores","changes"}.',
    "corrected: the same email, fixed, keeping the writer's voice and length.",
    "summary: one or two sentences in English saying what the email does well and what it must fix.",
    'register: "too-informal" | "right" | "too-formal" for the audience.',
    "scores: integers 1-5 for grammar, vocabulary, register and cohesion.",
    'changes: each {"kind","original","corrected","why","topicSlug"} where kind is grammar|vocabulary|register|cohesion|spelling, original is the exact fragment from the email, why is one short English sentence, and topicSlug is the lesson that explains it.',
    `Available lessons (slug=title): ${lessons}`,
    "If a change does not map to a lesson, leave topicSlug out. Report at most 12 changes.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseCorrection(raw: string): Correction {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("the reply had no JSON object");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("the reply was not valid JSON");
  }

  const result = correctionSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`the correction failed validation: ${issues}`);
  }
  return result.data;
}

/** Average of the four criteria, one decimal, for the badge on the page. */
export function overallScore(correction: Pick<Correction, "scores">): number {
  const values = Object.values(correction.scores);
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}
