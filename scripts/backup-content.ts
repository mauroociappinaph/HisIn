import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "@/shared/db/prisma";

/**
 * Snapshot of every piece of generated content, and how to put it back.
 *
 * The whole course lives in the database: 149 topics, 596 materials, 2.500
 * glossary rows, the prologues and the quotes. Several scripts delete rows on
 * purpose, so there has to be a way back that does not depend on remembering which
 * file was written by which run.
 *
 *   tsx scripts/backup-content.ts                 write odd/backups/content-<stamp>.json
 *   tsx scripts/backup-content.ts --restore <f>   put it back, idempotently
 */
interface Snapshot {
  takenAt: string;
  mistakes?: { kind: string; original: string; corrected: string; why: string; topicSlug: string | null; source: string }[];
  expansions?: { queryKey: string; keywords: string[]; topics: string[] }[];
  topics: {
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
  }[];
  units: { unitOrder: number; unit: string; prologue: string }[];
}

async function snapshot(): Promise<Snapshot> {
  const topics = await prisma.topic.findMany({
    orderBy: [{ unitOrder: "asc" }, { ord: "asc" }],
    include: { materials: true, glosses: true },
  });
  const units = await prisma.unitMeta.findMany({ orderBy: { unitOrder: "asc" } });

  const [mistakes, expansions] = await Promise.all([
    prisma.mistake.findMany({ select: { kind: true, original: true, corrected: true, why: true, topicSlug: true, source: true } }),
    prisma.searchExpansion.findMany({ select: { queryKey: true, keywords: true, topics: true } }),
  ]);

  return {
    takenAt: new Date().toISOString(),
    mistakes,
    expansions,
    topics: topics.map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      ord: topic.ord,
      code: topic.code,
      unit: topic.unit,
      unitOrder: topic.unitOrder,
      level: topic.level,
      focus: topic.focus,
      quote: topic.quote,
      prologue: topic.prologue,
      materials: topic.materials.map((material) => ({
        skill: material.skill,
        title: material.title,
        body: material.body,
        keyPoints: material.keyPoints,
      })),
      glosses: topic.glosses.map((gloss) => ({
        term: gloss.term,
        translation: gloss.translation,
        kind: gloss.kind,
        note: gloss.note,
      })),
    })),
    units,
  };
}

async function restore(file: string) {
  const data = JSON.parse(await readFile(resolve(file), "utf8")) as Snapshot;
  let topics = 0;
  let materials = 0;
  let glosses = 0;

  for (const entry of data.topics) {
    const row = await prisma.topic.upsert({
      where: { slug: entry.slug },
      update: {
        title: entry.title,
        ord: entry.ord,
        code: entry.code,
        unit: entry.unit,
        unitOrder: entry.unitOrder,
        level: entry.level as never,
        focus: entry.focus,
        quote: entry.quote,
        prologue: entry.prologue,
      },
      create: {
        slug: entry.slug,
        title: entry.title,
        ord: entry.ord,
        code: entry.code,
        unit: entry.unit,
        unitOrder: entry.unitOrder,
        level: entry.level as never,
        focus: entry.focus,
        quote: entry.quote,
        prologue: entry.prologue,
      },
    });
    topics += 1;

    for (const material of entry.materials) {
      await prisma.topicMaterial.upsert({
        where: { topicId_skill: { topicId: row.id, skill: material.skill as never } },
        update: { title: material.title, body: material.body, keyPoints: material.keyPoints },
        create: {
          topicId: row.id,
          skill: material.skill as never,
          title: material.title,
          body: material.body,
          keyPoints: material.keyPoints,
        },
      });
      materials += 1;
    }

    for (const gloss of entry.glosses) {
      await prisma.storyGloss.upsert({
        where: { topicId_term: { topicId: row.id, term: gloss.term } },
        update: { translation: gloss.translation, kind: gloss.kind, note: gloss.note },
        create: { topicId: row.id, term: gloss.term, translation: gloss.translation, kind: gloss.kind, note: gloss.note },
      });
      glosses += 1;
    }
  }

  // The learner's mistakes and the cached expansions live in the same database, so
  // they are part of the snapshot: a restore that forgets them loses real work.
  const owner = await prisma.user.findFirst({ select: { id: true } });
  for (const mistake of data.mistakes ?? []) {
    if (!owner) break;
    // The unique key is an expression index (lower(original)), which Prisma cannot
    // address as a compound key, so the lookup is explicit.
    const existing = await prisma.mistake.findFirst({
      where: { userId: owner.id, original: { equals: mistake.original, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      await prisma.mistake.update({
        where: { id: existing.id },
        data: { corrected: mistake.corrected, why: mistake.why, topicSlug: mistake.topicSlug },
      });
      continue;
    }
    await prisma.mistake.create({
      data: {
        userId: owner.id,
        kind: mistake.kind,
        original: mistake.original,
        corrected: mistake.corrected,
        why: mistake.why,
        topicSlug: mistake.topicSlug,
        source: mistake.source,
      },
    });
  }

  for (const expansion of data.expansions ?? []) {
    await prisma.searchExpansion.upsert({
      where: { queryKey: expansion.queryKey },
      update: { keywords: expansion.keywords, topics: expansion.topics },
      create: { queryKey: expansion.queryKey, keywords: expansion.keywords, topics: expansion.topics },
    });
  }

  for (const unit of data.units) {
    await prisma.unitMeta.upsert({
      where: { unitOrder: unit.unitOrder },
      update: { unit: unit.unit, prologue: unit.prologue },
      create: { unitOrder: unit.unitOrder, unit: unit.unit, prologue: unit.prologue },
    });
  }

  console.log(`restored topics=${topics} materials=${materials} glosses=${glosses} units=${data.units.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const restoreIndex = args.indexOf("--restore");

  if (restoreIndex !== -1) {
    const file = args[restoreIndex + 1];
    if (!file) throw new Error("--restore needs a file path");
    await restore(file);
    await prisma.$disconnect();
    return;
  }

  const data = await snapshot();
  const directory = resolve("odd/backups");
  await mkdir(directory, { recursive: true });
  const stamp = data.takenAt.replace(/[:.]/g, "-");
  const file = resolve(directory, `content-${stamp}.json`);
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");

  const materials = data.topics.reduce((total, topic) => total + topic.materials.length, 0);
  const glosses = data.topics.reduce((total, topic) => total + topic.glosses.length, 0);
  console.log(`snapshot: ${file}`);
  console.log(`topics=${data.topics.length} materials=${materials} glosses=${glosses} units=${data.units.length}`);
  await prisma.$disconnect();
}

void main();
