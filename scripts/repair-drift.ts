import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { prisma } from "@/shared/db/prisma";
import { isGrammarTopic, mentionsTopic } from "@/modules/topics/schema";

/**
 * Deletes the materials that drifted away from their own topic, and only those.
 *
 * Deleting before generating is dangerous: if the provider fails, the lesson is
 * left empty. So every removal is written to a backup file first, and the backup
 * is what `--restore` reads. Nothing leaves the database without a copy on disk.
 *
 *   tsx scripts/repair-drift.ts             report only
 *   tsx scripts/repair-drift.ts --apply     back up, then delete the drifted ones
 *   tsx scripts/repair-drift.ts --restore <file>
 */
interface BackupRow {
  topicSlug: string;
  skill: string;
  title: string;
  body: string;
  keyPoints: string[];
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const restoreIndex = args.indexOf("--restore");

  if (restoreIndex !== -1) {
    const file = args[restoreIndex + 1];
    if (!file) throw new Error("--restore needs a file path");
    const rows = JSON.parse(await readFile(resolve(file), "utf8")) as BackupRow[];
    for (const row of rows) {
      const topic = await prisma.topic.findUnique({ where: { slug: row.topicSlug }, select: { id: true } });
      if (!topic) continue;
      await prisma.topicMaterial.upsert({
        where: { topicId_skill: { topicId: topic.id, skill: row.skill as never } },
        update: { title: row.title, body: row.body, keyPoints: row.keyPoints },
        create: {
          topicId: topic.id,
          skill: row.skill as never,
          title: row.title,
          body: row.body,
          keyPoints: row.keyPoints,
        },
      });
    }
    console.log(`restored materials: ${rows.length}`);
    await prisma.$disconnect();
    return;
  }

  const topics = await prisma.topic.findMany({
    select: { id: true, slug: true, title: true, materials: { select: { id: true, skill: true, title: true, body: true, keyPoints: true } } },
    orderBy: [{ unitOrder: "asc" }, { ord: "asc" }],
  });

  const toDelete: { id: string; row: BackupRow }[] = [];

  for (const topic of topics) {
    if (isGrammarTopic(topic.title)) continue;
    const drifted = topic.materials.filter((material) => !mentionsTopic(material.body, topic.title));
    if (drifted.length < 3) continue;
    for (const material of drifted) {
      toDelete.push({
        id: material.id,
        row: {
          topicSlug: topic.slug,
          skill: material.skill,
          title: material.title,
          body: material.body,
          keyPoints: material.keyPoints,
        },
      });
    }
  }

  console.log(`materials flagged: ${toDelete.length}`);
  if (!apply) {
    console.log("dry run: pass --apply to back up and delete");
    await prisma.$disconnect();
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const directory = resolve("odd/backups");
  await mkdir(directory, { recursive: true });
  const file = resolve(directory, `drift-${stamp}.json`);
  await writeFile(file, JSON.stringify(toDelete.map((entry) => entry.row), null, 2), "utf8");

  await prisma.topicMaterial.deleteMany({ where: { id: { in: toDelete.map((entry) => entry.id) } } });
  console.log(`deleted: ${toDelete.length} · backup: ${file}`);
  await prisma.$disconnect();
}

void main();
