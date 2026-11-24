import { z } from "zod";
import { usesTerm } from "@/shared/lib/text";
import { LESSON_SECTIONS, isCompleteLessonContent } from "@/modules/lessons/structure";

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
export const GENERATION_KINDS = ["question", "vocabulary", "lesson", "story"] as const;

/**
 * Module slugs that real pages render. Generated content outside this set would
 * be invisible in the app, so the engine refuses it instead of writing orphans.
 */
export const CONTENT_MODULES = [
  "vocabulary",
  "reading",
  "listening",
  "business-english",
  "contracts",
  "grammar",
] as const;
export const contentModuleSchema = z.enum(CONTENT_MODULES);

export const cefrLevelSchema = z.enum(CEFR_LEVELS);
export const skillSchema = z.enum(SKILLS);
export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const generationKindSchema = z.enum(GENERATION_KINDS);

/** What a caller may ask the engine to generate. */
export const generationRequestSchema = z
  .object({
    kind: generationKindSchema.default("question"),
    level: cefrLevelSchema,
    skill: skillSchema.optional(),
    type: questionTypeSchema.optional(),
    count: z.number().int().min(1).max(5).default(3),
    topic: z.string().trim().min(3).max(120).optional(),
    /** Teaching context (discipline, educational level, session length). */
    context: z.string().trim().max(400).optional(),
  })
  .superRefine((request, ctx) => {
    if (request.kind !== "question") return;
    if (!request.skill) {
      ctx.addIssue({ code: "custom", path: ["skill"], message: "skill is required for questions" });
    }
    if (!request.type) {
      ctx.addIssue({ code: "custom", path: ["type"], message: "type is required for questions" });
    }
  });

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type GenerationKind = (typeof GENERATION_KINDS)[number];

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

export const generatedVocabularySchema = z.object({
  term: z.string().min(2).max(80),
  definition: z.string().min(10).max(400),
  example: z.string().min(10).max(400),
  module: contentModuleSchema,
  level: cefrLevelSchema,
});

export const generatedLessonSchema = z
  .object({
    module: contentModuleSchema,
    level: cefrLevelSchema,
    title: z.string().min(5).max(120),
    summary: z.string().min(10).max(300),
    content: z.string().min(50).max(6000),
    order: z.number().int().min(0).max(99).default(0),
  })
  .superRefine((lesson, ctx) => {
    // A lesson the renderer cannot split is a wall of text, so the structure is
    // enforced at the boundary instead of repaired afterwards.
    if (!isCompleteLessonContent(lesson.content)) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: `content must declare every lesson section: ${LESSON_SECTIONS.map((section) => `${section.marker}:`).join(", ")}`,
      });
    }
  });

const generatedStoryShape = z.object({
  module: contentModuleSchema,
  level: cefrLevelSchema,
  title: z.string().min(5).max(120),
  body: z.string().min(400).max(3000),
  translation: z.string().min(20).max(900),
  targetWords: z.array(z.string().min(2).max(40)).min(3).max(12),
});

/**
 * A story only teaches the words it actually uses.
 *
 * Structural checks alone would accept a story that declares ten target words
 * and uses none of them, so every declared word must appear in the body. Repeat
 * declarations are rejected instead of silently deduplicated: a duplicated word
 * means the model lost track of its own list.
 */
export const generatedStorySchema = generatedStoryShape.superRefine((story, ctx) => {
  const seen = new Set<string>();
  for (const word of story.targetWords) {
    const key = word.trim().toLowerCase();
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWords"],
        message: `target words must be unique: "${word}" repeats`,
      });
      continue;
    }
    seen.add(key);
    if (!usesTerm(story.body, word)) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWords"],
        message: `target word "${word}" must appear in the body`,
      });
    }
  }
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionShape>;
export type GeneratedVocabulary = z.infer<typeof generatedVocabularySchema>;
export type GeneratedLesson = z.infer<typeof generatedLessonSchema>;
export type GeneratedStory = z.infer<typeof generatedStorySchema>;

/** The batch key and item schema each kind must return. */
export const BATCH_KEY: Record<GenerationKind, string> = {
  question: "questions",
  vocabulary: "vocabulary",
  lesson: "lessons",
  story: "stories",
};

function extractJsonObject(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("model response did not contain a JSON object");
  }
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("model response was not valid JSON");
  }
}

/**
 * Parses the model's raw reply into validated items of one kind.
 *
 * Tolerates markdown fences and surrounding prose, but never tolerates a
 * malformed or unanswerable item.
 */
function parseBatch<T>(raw: string, key: string, item: z.ZodType<T>): T[] {
  const parsed = extractJsonObject(raw);
  const batch = z
    .object({ [key]: z.array(item).min(1).max(10) })
    .safeParse(parsed);

  if (!batch.success) {
    const issues = batch.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`model response failed validation: ${issues}`);
  }

  return (batch.data as Record<string, T[]>)[key] ?? [];
}

export function parseGeneratedBatch(raw: string): GeneratedQuestion[] {
  return parseBatch(raw, BATCH_KEY.question, generatedQuestionSchema);
}

export function parseGeneratedVocabulary(raw: string): GeneratedVocabulary[] {
  return parseBatch(raw, BATCH_KEY.vocabulary, generatedVocabularySchema);
}

export function parseGeneratedLessons(raw: string): GeneratedLesson[] {
  return parseBatch(raw, BATCH_KEY.lesson, generatedLessonSchema);
}

export function parseGeneratedStories(raw: string): GeneratedStory[] {
  return parseBatch(raw, BATCH_KEY.story, generatedStorySchema);
}
