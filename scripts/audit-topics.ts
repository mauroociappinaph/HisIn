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

  // The defect is the grammar slot of a domain lesson teaching something else. The
  // reading, writing and story are reported only as a soft signal, because a memo
  // about corporate writing does not have to repeat the words "corporate writing".
  const drifted: { slug: string; title: string; skills: string[] }[] = [];
  const soft: { slug: string; skills: string[] }[] = [];

  for (const topic of topics) {
    if (isGrammarTopic(topic.title)) continue;
    const driftedSkills = topic.materials
      .filter((material) => !mentionsTopic(material.body, topic.title))
      .map((material) => material.skill);
    if (driftedSkills.includes("GRAMMAR")) {
      drifted.push({ slug: topic.slug, title: topic.title, skills: driftedSkills });
    } else if (driftedSkills.length >= 3) {
      soft.push({ slug: topic.slug, skills: driftedSkills });
    }
  }

  console.log(`topics: ${topics.length}`);
  console.log(`grammar drifted from its own topic: ${drifted.length}`);
  for (const entry of drifted) console.log(`  ${entry.slug} · ${entry.title} · ${entry.skills.join(",")}`);
  console.log(`soft signal - no title word in 3+ skills: ${soft.length}`);
  for (const entry of soft) console.log(`  ${entry.slug} · ${entry.skills.join(",")}`);
  await prisma.$disconnect();
}

void main();
