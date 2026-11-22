/**
 * The syllabus: modules with submodules.
 *
 * Owner-provided temario, kept as data so the UI and the generator both read it
 * from one place. `pnpm seed:topics` is idempotent: it updates titles, codes and
 * module assignment, and never duplicates or deletes a topic.
 */
import { loadLocalEnv } from "../src/shared/lib/load-env";

loadLocalEnv();

interface SeedTopic {
  slug: string;
  title: string;
  ord: number;
  code?: string;
  unit: string;
  unitOrder: number;
  level: "A2" | "B1";
}

const FUNDAMENTOS = "1 · Fundamentos: to be, pronombres, artículos y lugar";
const PRESENT_SIMPLE = "6 · Present simple";
const CAN = "7 · Can: habilidad y permiso";
const CONTINUOUS = "8 · Present continuous e imperativos";

const TOPICS: SeedTopic[] = [
  {
    slug: "verb-to-be",
    title: "Verbo to be (afirmativo, negativo e interrogativo)",
    ord: 1,
    code: "1.1",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "subject-pronouns-possessives",
    title: "Pronombres personales sujeto (I, you, he...) y adjetivos posesivos (my, your, his...)",
    ord: 2,
    code: "1.2",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "articles-and-plurals",
    title: "Artículos indefinidos y definidos (a, an, the) y plurales regulares/irregulares básicos",
    ord: 3,
    code: "1.3",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "demonstratives",
    title: "Demostrativos (this, that, these, those)",
    ord: 4,
    code: "1.4",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "there-is-there-are-prepositions",
    title: "There is / There are y preposiciones de lugar (in, on, under, next to)",
    ord: 5,
    code: "1.5",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "present-simple-affirmative",
    title: "Afirmativo y usos: rutinas, verdades generales, tercera persona singular (-s, -es, -ies)",
    ord: 6,
    code: "6.1",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "present-simple-negative-questions",
    title: "Negativo e interrogativo: don't / doesn't, Do / Does, respuestas cortas y preguntas abiertas",
    ord: 7,
    code: "6.2",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "present-simple-adverbs-frequency",
    title: "Adverbios de frecuencia: escala, posición y uso con never",
    ord: 8,
    code: "6.3",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "present-simple-exceptions-integration",
    title: "Excepciones e integración: posición con to be, How often...? y práctica integradora",
    ord: 9,
    code: "6.4",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "can-structure",
    title: "Can: estructura y reglas del modal (forma invariable, verbo base, can't / cannot, respuestas cortas)",
    ord: 10,
    code: "7.1",
    unit: CAN,
    unitOrder: 7,
    level: "A2",
  },
  {
    slug: "can-ability-permission",
    title: "Can: habilidad y permiso (destrezas, pedidos, autorización y prohibición)",
    ord: 11,
    code: "7.2",
    unit: CAN,
    unitOrder: 7,
    level: "A2",
  },
  {
    slug: "can-pronunciation-integration",
    title: "Can: pronunciación e integración (can /kən/ vs can't /kænt/)",
    ord: 12,
    code: "7.3",
    unit: CAN,
    unitOrder: 7,
    level: "A2",
  },
  {
    slug: "present-continuous-affirmative",
    title: "Present continuous afirmativo y ortografía del -ing (working, making, running)",
    ord: 13,
    code: "8.1",
    unit: CONTINUOUS,
    unitOrder: 8,
    level: "A2",
  },
  {
    slug: "present-continuous-negative-questions",
    title: "Present continuous negativo e interrogativo ('m not / isn't / aren't, Is she working?)",
    ord: 14,
    code: "8.2",
    unit: CONTINUOUS,
    unitOrder: 8,
    level: "A2",
  },
  {
    slug: "imperatives",
    title: "Imperativos afirmativo y negativo (órdenes, instrucciones, please, Don't...)",
    ord: 15,
    code: "8.3",
    unit: CONTINUOUS,
    unitOrder: 8,
    level: "A2",
  },
  {
    slug: "continuous-vs-imperative",
    title: "Integración y contraste: describir lo que pasa vs. dar una orden (He is running / Stop running!)",
    ord: 16,
    code: "8.4",
    unit: CONTINUOUS,
    unitOrder: 8,
    level: "A2",
  },
];

async function main() {
  const { TopicRepository } = await import("../src/modules/topics/repository");
  const repo = new TopicRepository();

  for (const topic of TOPICS) {
    await repo.ensureTopic({
      slug: topic.slug,
      title: topic.title,
      ord: topic.ord,
      code: topic.code,
      unit: topic.unit,
      unitOrder: topic.unitOrder,
      level: topic.level,
      focus: "healthtech, emprendimiento y Silicon Valley",
    });
    console.log(`ok ${topic.code ?? topic.ord} · ${topic.unit} · ${topic.slug}`);
  }
}

void main();
