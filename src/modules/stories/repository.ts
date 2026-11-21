import { prisma } from "@/shared/db/prisma";
import type { CefrLevel, StoryDTO } from "@/shared/types";

/**
 * Read side of the generated stories.
 *
 * Stories are written by the AI engine (`kind: "story"`), never by this module,
 * so the trainer only ever reads validated content.
 */
export class StoryRepository {
  async list(options: { module?: string; level?: CefrLevel } = {}): Promise<StoryDTO[]> {
    const rows = await prisma.vocabularyStory.findMany({
      where: {
        ...(options.module ? { module: options.module } : {}),
        ...(options.level ? { level: options.level } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      module: row.module,
      level: row.level as CefrLevel,
      title: row.title,
      body: row.body,
      translation: row.translation,
      targetWords: row.targetWords,
    }));
  }
}
