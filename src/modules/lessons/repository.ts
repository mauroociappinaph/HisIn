import { prisma } from "@/shared/db/prisma";
import type { LessonDTO, CefrLevel } from "@/shared/types";

export class LessonRepository {
  async findByModule(module: string, level?: CefrLevel): Promise<LessonDTO[]> {
    const rows = await prisma.lesson.findMany({
      where: { module, ...(level ? { level } : {}) },
      orderBy: { order: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      module: r.module,
      level: r.level as CefrLevel,
      title: r.title,
      summary: r.summary,
      content: r.content,
      order: r.order,
    }));
  }

  async findById(id: string): Promise<LessonDTO | null> {
    const r = await prisma.lesson.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      module: r.module,
      level: r.level as CefrLevel,
      title: r.title,
      summary: r.summary,
      content: r.content,
      order: r.order,
    };
  }
}
