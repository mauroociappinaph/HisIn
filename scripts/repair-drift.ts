import { prisma } from "@/shared/db/prisma";
import { isGrammarTopic, mentionsTopic } from "@/modules/topics/schema";

/**
 * Deletes the materials that drifted away from their own topic.
 *
 * Only the drifted skills of domain lessons are removed, and only when at least
 * three of the four drifted: a single odd material is noise, three means the lesson
 * was written for something else. The generator then refills exactly those slots.
 *
 * Pass --apply to delete; without it the script only reports.
 */
async function main() {
  const apply = process.argv.includes("--apply");
  const topics = await prisma.topic.findMany({
    select: { id: true, slug: true, title: true, materials: { select: { id: true, skill: true, body: true } } },
    orderBy: [{ unitOrder: "asc" }, { ord: "asc" }],
  });

  let removed = 0;
  const flagged: string[] = [];

  for (const topic of topics) {
    if (isGrammarTopic(topic.title)) continue;
    const drifted = topic.materials.filter((material) => !mentionsTopic(material.body, topic.title));
    if (drifted.length < 3) continue;
    flagged.push(topic.slug);
    if (!apply) continue;
    await prisma.topicMaterial.deleteMany({ where: { id: { in: drifted.map((material) => material.id) } } });
    removed += drifted.length;
  }

  console.log(`flagged topics: ${flagged.length}`);
  for (const slug of flagged) console.log(`  ${slug}`);
  console.log(apply ? `deleted materials: ${removed}` : "dry run: pass --apply to delete");
  await prisma.$disconnect();
}

void main();
