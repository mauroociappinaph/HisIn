/**
 * Seeds the syllabus topics (owner-provided) so the engine can fill them.
 *
 * Idempotent: running it again updates titles/order and never duplicates.
 */
import { loadLocalEnv } from "../src/shared/lib/load-env";

loadLocalEnv();

const TOPICS = [
  {
    slug: "verb-to-be",
    title: "Verbo to be (afirmativo, negativo e interrogativo)",
    ord: 1,
    level: "A2" as const,
  },
  {
    slug: "subject-pronouns-possessives",
    title: "Pronombres personales sujeto (I, you, he...) y adjetivos posesivos (my, your, his...)",
    ord: 2,
    level: "A2" as const,
  },
  {
    slug: "articles-and-plurals",
    title: "Artículos indefinidos y definidos (a, an, the) y plurales regulares/irregulares básicos",
    ord: 3,
    level: "A2" as const,
  },
  {
    slug: "demonstratives",
    title: "Demostrativos (this, that, these, those)",
    ord: 4,
    level: "A2" as const,
  },
  {
    slug: "there-is-there-are-prepositions",
    title: "There is / There are y preposiciones de lugar (in, on, under, next to)",
    ord: 5,
    level: "A2" as const,
  },
];

async function main() {
  const { TopicRepository } = await import("../src/modules/topics/repository");
  const repo = new TopicRepository();

  for (const topic of TOPICS) {
    await repo.ensureTopic({
      ...topic,
      focus: "healthtech, emprendimiento y Silicon Valley",
    });
    console.log(`ok ${topic.ord} · ${topic.slug}`);
  }
}

void main();
