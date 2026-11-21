import { prisma } from "@/shared/db/prisma";
import type { VocabularyDTO, CefrLevel } from "@/shared/types";

export class VocabularyRepository {
  async findByModule(module: string, level?: CefrLevel): Promise<VocabularyDTO[]> {
    const rows = await prisma.vocabulary.findMany({
      where: { module, ...(level ? { level } : {}) },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      term: r.term,
      definition: r.definition,
      example: r.example,
      module: r.module,
      level: r.level as CefrLevel,
    }));
  }

  /** Whole bank, for the trainer's explorer and quiz pool. */
  async findAll(): Promise<VocabularyDTO[]> {
    const rows = await prisma.vocabulary.findMany({
      orderBy: [{ module: "asc" }, { level: "asc" }, { term: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      term: r.term,
      definition: r.definition,
      example: r.example,
      module: r.module,
      level: r.level as CefrLevel,
    }));
  }
}
