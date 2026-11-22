import { prisma } from "@/shared/db/prisma";
import { isGrammarTopic, mentionsTopic } from "@/modules/topics/schema";

/**
 * Lists the lessons whose material drifted to another topic.
 *
 * Run before regenerating: it names the exact submodules that need a rebuild, so
 * the quota is spent on real defects instead of every lesson.
 */
async function main() {
  const topics = await prisma.topic.findMany({
    select: {
      slug: true,
      title: true,
      unit: true,
      materials: { select: { skill: true, title: true, body: true } },
    },
    orderBy: [{ unitOrder: "asc" }, { ord: "asc" }],
  });

  const drifted: { slug: string; title: string; skills: string[] }[] = [];
  for (const topic of topics) {
    const skills = topic.materials
      .filter((material) => !mentionsTopic(material.body, topic.title))
      .map((material) => material.skill);
    if (skills.length >= 3 && !isGrammarTopic(topic.title)) {
      drifted.push({ slug: topic.slug, title: topic.title, skills });
    }
  }

  console.log(`topics: ${topics.length}`);
  console.log(`domain topics whose material drifted (3+ skills): ${drifted.length}`);
  for (const entry of drifted) console.log(`  ${entry.slug} · ${entry.title} · ${entry.skills.join(",")}`);
  await prisma.$disconnect();
}

void main();
