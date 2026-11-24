import { prisma } from "@/shared/db/prisma";
import type { CefrLevel } from "@/shared/types";
import { TOPIC_SKILLS, type TopicMaterials, type TopicSkill } from "./schema";
import type { GlossEntry } from "./glossary";

export interface TopicMaterialDTO {
  skill: TopicSkill;
  title: string;
  body: string;
  keyPoints: string[];
}

export interface TopicDTO {
  id: string;
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
  /** Opening line shown before the lesson starts. */
  quote: string | null;
  /** English prologue of the submodule. */
  prologue: string | null;
  /** Per-story glossary: translations and the multi-word units of the story. */
  glosses: GlossEntry[];
}

function toDTO(row: {
  id: string;
  slug: string;
  title: string;
  ord: number;
  code: string | null;
  unit: string | null;
  unitOrder: number;
  level: string;
  focus: string | null;
  quote: string | null;
  prologue: string | null;
  materials: { skill: string; title: string; body: string; keyPoints: string[] }[];
  glosses: { term: string; translation: string; kind: string; note: string | null }[];
}): TopicDTO {
  const materials = TOPIC_SKILLS.map((skill) => row.materials.find((m) => m.skill === skill)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m),
  );

  return {
    id: row.id,
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
    quote: row.quote,
    prologue: row.prologue,
    missing: TOPIC_SKILLS.filter((skill) => !materials.some((m) => m.skill === skill)),
    glosses: row.glosses.map((gloss) => ({
      term: gloss.term,
      translation: gloss.translation,
      kind: gloss.kind as GlossEntry["kind"],
      ...(gloss.note ? { note: gloss.note } : {}),
    })),
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
      include: { materials: true, glosses: true },
    });
    return rows.map(toDTO);
  }

  async findBySlug(slug: string): Promise<TopicDTO | null> {
    const row = await prisma.topic.findUnique({
      where: { slug },
      include: { materials: true, glosses: true },
    });
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

  /** Every material, for the duplicate check before saving new content. */
  async materialCorpus(): Promise<{ skill: string; body: string; topicSlug: string }[]> {
    const rows = await prisma.topicMaterial.findMany({
      select: { skill: true, body: true, topic: { select: { slug: true } } },
    });
    return rows.map((row) => ({ skill: row.skill, body: row.body, topicSlug: row.topic.slug }));
  }

  /** Prologues of every module, keyed by unit order. */
  async unitPrologues(): Promise<Map<number, string>> {
    const rows = await prisma.unitMeta.findMany({ select: { unitOrder: true, prologue: true } });
    return new Map(rows.map((row) => [row.unitOrder, row.prologue]));
  }

  /** Topic ids the learner already marked as done. */
  async completions(userId: string): Promise<string[]> {
    const rows = await prisma.topicCompletion.findMany({
      where: { userId },
      select: { topicId: true },
    });
    return rows.map((row) => row.topicId);
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

  /**
   * Stores a glossary once per topic.
   *
   * A second run is a no-op: the learner may already have read the story, and the
   * translations underneath their eyes must not change behind their back.
   */
  async saveGlosses(topicId: string, entries: GlossEntry[]): Promise<number> {
    const existing = await prisma.storyGloss.count({ where: { topicId } });
    if (existing > 0) return 0;

    let saved = 0;
    for (const entry of entries) {
      await prisma.storyGloss.create({
        data: {
          topicId,
          term: entry.term,
          translation: entry.translation,
          kind: entry.kind,
          note: entry.note ?? null,
        },
      });
      saved += 1;
    }
    return saved;
  }
}
