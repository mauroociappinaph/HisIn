import { z } from "zod";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const SKILLS = [
  "VOCABULARY",
  "GRAMMAR",
  "READING",
  "LISTENING",
  "BUSINESS",
  "CONTRACTS",
] as const;
export const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "TRUE_FALSE",
  "LISTENING_MCQ",
] as const;

export const cefrLevelSchema = z.enum(CEFR_LEVELS);
export const skillSchema = z.enum(SKILLS);
export const questionTypeSchema = z.enum(QUESTION_TYPES);

/** What the caller may ask the engine to generate. */
export const questionRequestSchema = z.object({
  level: cefrLevelSchema,
  skill: skillSchema,
  type: questionTypeSchema,
  count: z.number().int().min(1).max(5).default(3),
  topic: z.string().trim().min(3).max(120).optional(),
});

export type QuestionRequest = z.infer<typeof questionRequestSchema>;

const generatedQuestionShape = z.object({
  level: cefrLevelSchema,
  skill: skillSchema,
  type: questionTypeSchema,
  prompt: z.string().min(10).max(600),
  options: z.array(z.string().min(1).max(200)).max(6).default([]),
  answer: z.string().min(1).max(200),
  explanation: z.string().max(800).optional(),
  tags: z.array(z.string().min(1).max(30)).max(8).default([]),
});

/**
 * A single generated question.
 *
 * The model must satisfy the structural rules of its own type, otherwise the
 * item would be unanswerable in the UI: choice questions need at least two
 * options and the answer must be one of them, and FILL_BLANK must not carry
 * options at all.
 */
export const generatedQuestionSchema = generatedQuestionShape.superRefine((question, ctx) => {
  if (question.type === "FILL_BLANK") {
    if (question.options.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "FILL_BLANK questions must not carry options",
      });
    }
    return;
  }
  if (question.options.length < 2) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: `${question.type} questions need at least two options`,
    });
    return;
  }
  if (!question.options.includes(question.answer)) {
    ctx.addIssue({
      code: "custom",
      path: ["answer"],
      message: "answer must be one of the options",
    });
  }
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionShape>;

export const generatedBatchSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1).max(10),
});

/**
 * Parses the model's raw reply into validated questions.
 *
 * Tolerates markdown fences and surrounding prose, but never tolerates an
 * unanswerable or malformed question.
 */
export function parseGeneratedBatch(raw: string): GeneratedQuestion[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("model response did not contain a JSON object");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("model response was not valid JSON");
  }

  const result = generatedBatchSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`model response failed validation: ${issues}`);
  }
  return result.data.questions;
}
