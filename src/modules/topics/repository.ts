import { prisma } from "@/shared/db/prisma";
import type { CefrLevel } from "@/shared/types";
import { TOPIC_SKILLS, type TopicMaterials, type TopicSkill } from "./schema";

export interface TopicMaterialDTO {
  skill: TopicSkill;
  title: string;
  body: string;
  keyPoints: string[];
}

export interface TopicDTO {
  slug: string;
  title: string;
  order: number;
  code: string | null;
  unit: string | null;
  unitOrder: number;
  level: CefrLevel;
  focus: string | null;
  materials: TopicMaterialDTO[];
  missing: TopicSkill[];
}

function toDTO(row: {
  slug: string;
  title: string;
  ord: number;
  code: string | null;
  unit: string | null;
  unitOrder: number;
  level: string;
  focus: string | null;
  materials: { skill: string; title: string; body: string; keyPoints: string[] }[];
}): TopicDTO {
  const materials = TOPIC_SKILLS.map((skill) => row.materials.find((m) => m.skill === skill)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m),
  );

  return {
    slug: row.slug,
    title: row.title,
    order: row.ord,
    code: row.code,
    unit: row.unit,
    unitOrder: row.unitOrder,
    level: row.level as CefrLevel,
    focus: row.focus,
    materials: materials.map((material) => ({
      skill: material.skill as TopicSkill,
      title: material.title,
      body: material.body,
      keyPoints: material.keyPoints,
    })),
    missing: TOPIC_SKILLS.filter((skill) => !materials.some((m) => m.skill === skill)),
  };
}

/**
 * Syllabus topics and their materials.
 *
 * Materials are written by the engine and stored once: re-opening a topic never
 * regenerates it, and a generation only fills the skills that are still missing.
 */
export class TopicRepository {
  async list(): Promise<TopicDTO[]> {
    const rows = await prisma.topic.findMany({
      orderBy: [{ unitOrder: "asc" }, { ord: "asc" }],
      include: { materials: true },
    });
    return rows.map(toDTO);
  }

  async findBySlug(slug: string): Promise<TopicDTO | null> {
    const row = await prisma.topic.findUnique({ where: { slug }, include: { materials: true } });
    return row ? toDTO(row) : null;
  }

  async ensureTopic(input: {
    slug: string;
    title: string;
    ord: number;
    level: CefrLevel;
    focus?: string;
    code?: string;
    unit?: string;
    unitOrder?: number;
  }) {
    return prisma.topic.upsert({
      where: { slug: input.slug },
      update: {
        title: input.title,
        ord: input.ord,
        level: input.level,
        focus: input.focus ?? null,
        code: input.code ?? null,
        unit: input.unit ?? null,
        unitOrder: input.unitOrder ?? 0,
      },
      create: {
        slug: input.slug,
        title: input.title,
        ord: input.ord,
        level: input.level,
        focus: input.focus ?? null,
        code: input.code ?? null,
        unit: input.unit ?? null,
        unitOrder: input.unitOrder ?? 0,
      },
    });
  }

  /** Stores what the engine produced; existing skills are left untouched. */
  async saveMaterials(topicId: string, payload: TopicMaterials): Promise<number> {
    let saved = 0;
    for (const material of payload.materials) {
      const existing = await prisma.topicMaterial.findUnique({
        where: { topicId_skill: { topicId, skill: material.skill } },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.topicMaterial.create({
        data: {
          topicId,
          skill: material.skill,
          title: material.title,
          body: material.body,
          keyPoints: material.keyPoints,
        },
      });
      saved += 1;
    }
    return saved;
  }
}
