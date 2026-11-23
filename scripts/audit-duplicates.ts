import { prisma } from "@/shared/db/prisma";
import { findDuplicates, repeatedSentences } from "@/modules/topics/progression";

/**
 * Finds the material that repeats another one.
 *
 * Run before regenerating anything: it says which lessons are saying the same
 * thing, so the rebuild fixes the real defect instead of adding a third copy.
 */
async function main() {
  const rows = await prisma.topicMaterial.findMany({
    select: { skill: true, body: true, topic: { select: { slug: true, title: true, unitOrder: true } } },
    orderBy: [{ topic: { unitOrder: "asc" } }],
  });

  const corpus = rows.map((row) => ({
    skill: row.skill,
    body: row.body,
    topicSlug: row.topic.slug,
  }));

  const pairs: { first: string; second: string; skill: string; score: number }[] = [];
  for (const row of rows) {
    const hits = findDuplicates({ skill: row.skill, body: row.body }, corpus, 0.55);
    for (const hit of hits) {
      if (hit.topicSlug === row.topic.slug) continue;
      const key = [row.topic.slug, hit.topicSlug].sort().join("|");
      if (pairs.some((pair) => pair.first === key)) continue;
      pairs.push({ first: key, second: key, skill: row.skill, score: hit.score });
    }
  }

  const repeated = rows
    .map((row) => ({ slug: row.topic.slug, skill: row.skill, sentences: repeatedSentences(row.body) }))
    .filter((entry) => entry.sentences.length > 0);

  console.log(`materials: ${rows.length}`);
  console.log(`near-duplicate pairs (>= 0.55): ${pairs.length}`);
  for (const pair of pairs.sort((a, b) => b.score - a.score).slice(0, 25)) {
    console.log(`  ${pair.score.toFixed(2)} · ${pair.skill} · ${pair.first.replace("|", "  <->  ")}`);
  }
  console.log(`materials with a repeated sentence: ${repeated.length}`);
  for (const entry of repeated.slice(0, 15)) {
    console.log(`  ${entry.skill} · ${entry.slug} · "${entry.sentences[0].slice(0, 70)}…"`);
  }

  // --strict turns the audit into a gate: any near-duplicate fails the run, which is
  // what CI uses, so repetition cannot come back silently.
  if (process.argv.includes("--strict") && pairs.length > 0) {
    console.log(`::error::${pairs.length} near-duplicate material pairs found`);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

void main();
