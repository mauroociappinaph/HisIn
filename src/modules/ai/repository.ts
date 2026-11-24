import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { canonicalizeLessonContent } from "@/modules/lessons/structure";
import type {
  GeneratedLesson,
  GeneratedQuestion,
  GeneratedStory,
  GeneratedVocabulary,
  GenerationKind,
  GenerationRequest,
} from "./schema";

export async function createJob(input: {
  request: GenerationRequest;
  prompt: string;
  model: string;
}) {
  return prisma.generationJob.create({
    data: {
      kind: input.request.kind,
      status: "PENDING",
      request: input.request as unknown as Prisma.InputJsonValue,
      prompt: input.prompt,
      model: input.model,
    },
  });
}

export async function markRunning(id: string, model: string) {
  return prisma.generationJob.update({
    where: { id },
    data: { status: "RUNNING", model, startedAt: new Date() },
  });
}

export async function markSucceeded(input: {
  id: string;
  model: string;
  output: unknown[];
  createdCount: number;
}) {
  return prisma.generationJob.update({
    where: { id: input.id },
    data: {
      status: "SUCCEEDED",
      model: input.model,
      output: input.output as unknown as Prisma.InputJsonValue,
      createdCount: input.createdCount,
      finishedAt: new Date(),
    },
  });
}

export async function markFailed(id: string, error: string) {
  return prisma.generationJob.update({
    where: { id },
    data: { status: "FAILED", error: error.slice(0, 2000), finishedAt: new Date() },
  });
}

export async function getJob(id: string) {
  return prisma.generationJob.findUnique({ where: { id } });
}

export async function listJobs(limit: number) {
  return prisma.generationJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      kind: true,
      status: true,
      model: true,
      createdCount: true,
      error: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

/**
 * Writes validated content, skipping rows that already exist.
 *
 * Generating twice must not silently double the bank: each item is checked
 * against its natural key first, so re-running a generation is safe.
 */
export async function persistContent(
  kind: GenerationKind,
  items: GeneratedQuestion[] | GeneratedVocabulary[] | GeneratedLesson[] | GeneratedStory[],
): Promise<number> {
  if (items.length === 0) return 0;

  if (kind === "question") {
    const questions = items as GeneratedQuestion[];
    const fresh: GeneratedQuestion[] = [];
    for (const question of questions) {
      const existing = await prisma.question.findFirst({
        where: {
          level: question.level,
          skill: question.skill,
          type: question.type,
          prompt: question.prompt,
        },
        select: { id: true },
      });
      if (!existing) fresh.push(question);
    }
    if (fresh.length === 0) return 0;
    const result = await prisma.$transaction(
      fresh.map((question) =>
        prisma.question.create({
          data: {
            level: question.level,
            skill: question.skill,
            type: question.type,
            prompt: question.prompt,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation ?? null,
            tags: question.tags,
          },
        }),
      ),
    );
    return result.length;
  }

  if (kind === "vocabulary") {
    const entries = items as GeneratedVocabulary[];
    const fresh: GeneratedVocabulary[] = [];
    for (const entry of entries) {
      const existing = await prisma.vocabulary.findFirst({
        where: { term: entry.term, module: entry.module },
        select: { id: true },
      });
      if (!existing) fresh.push(entry);
    }
    if (fresh.length === 0) return 0;
    const result = await prisma.$transaction(
      fresh.map((entry) =>
        prisma.vocabulary.create({
          data: {
            term: entry.term,
            definition: entry.definition,
            example: entry.example,
            module: entry.module,
            level: entry.level,
          },
        }),
      ),
    );
    return result.length;
  }

  if (kind === "story") {
    const stories = items as GeneratedStory[];
    const fresh: GeneratedStory[] = [];
    for (const story of stories) {
      const existing = await prisma.vocabularyStory.findFirst({
        where: { module: story.module, level: story.level, title: story.title },
        select: { id: true },
      });
      if (!existing) fresh.push(story);
    }
    if (fresh.length === 0) return 0;
    const result = await prisma.$transaction(
      fresh.map((story) =>
        prisma.vocabularyStory.create({
          data: {
            module: story.module,
            level: story.level,
            title: story.title,
            body: story.body,
            translation: story.translation,
            targetWords: story.targetWords,
          },
        }),
      ),
    );
    return result.length;
  }

  const lessons = items as GeneratedLesson[];
  const freshLessons: GeneratedLesson[] = [];
  for (const lesson of lessons) {
    const existing = await prisma.lesson.findFirst({
      where: { module: lesson.module, level: lesson.level, title: lesson.title },
      select: { id: true },
    });
    if (!existing) freshLessons.push(lesson);
  }
  if (freshLessons.length === 0) return 0;
  const result = await prisma.$transaction(
    freshLessons.map((lesson) =>
      prisma.lesson.create({
        data: {
          module: lesson.module,
          level: lesson.level,
          title: lesson.title,
          summary: lesson.summary,
          content: canonicalizeLessonContent(lesson.content),
          order: lesson.order,
        },
      }),
    ),
  );
  return result.length;
}
