import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type { GeneratedQuestion, QuestionRequest } from "./schema";

export async function createJob(input: { request: QuestionRequest; prompt: string; model: string }) {
  return prisma.generationJob.create({
    data: {
      kind: "question",
      status: "PENDING",
      request: input.request as unknown as Prisma.InputJsonValue,
      prompt: input.prompt,
      model: input.model,
    },
  });
}

export async function markRunning(id: string) {
  return prisma.generationJob.update({
    where: { id },
    data: { status: "RUNNING", startedAt: new Date() },
  });
}

export async function markSucceeded(input: {
  id: string;
  model: string;
  output: GeneratedQuestion[];
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

/**
 * Writes validated questions. Runs as one transaction so a partially invalid
 * batch can never leave the question bank inconsistent.
 */
export async function persistQuestions(questions: GeneratedQuestion[]): Promise<number> {
  const result = await prisma.$transaction(
    questions.map((question) =>
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
