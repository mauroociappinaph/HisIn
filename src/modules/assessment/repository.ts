import { prisma } from "@/shared/db/prisma";
import type { QuestionDTO, CefrLevel, Skill, QuestionType } from "@/shared/types";

export class AssessmentRepository {
  async findQuestions(params: { level?: CefrLevel; skill?: Skill; limit?: number }): Promise<QuestionDTO[]> {
    const rows = await prisma.question.findMany({
      where: {
        ...(params.level ? { level: params.level } : {}),
        ...(params.skill ? { skill: params.skill } : {}),
      },
      take: params.limit ?? 50,
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      level: r.level as CefrLevel,
      skill: r.skill as Skill,
      type: r.type as QuestionType,
      prompt: r.prompt,
      options: r.options as string[],
      answer: r.answer,
      explanation: r.explanation,
      audioUrl: r.audioUrl,
      tags: r.tags,
    }));
  }

  async findById(id: string): Promise<QuestionDTO | null> {
    const r = await prisma.question.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      level: r.level as CefrLevel,
      skill: r.skill as Skill,
      type: r.type as QuestionType,
      prompt: r.prompt,
      options: r.options as string[],
      answer: r.answer,
      explanation: r.explanation,
      audioUrl: r.audioUrl,
      tags: r.tags,
    };
  }
}
