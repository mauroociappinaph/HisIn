/**
 * The syllabus: modules with submodules.
 *
 * Owner-provided temario, kept as data so the UI and the generator both read it
 * from one place. `pnpm seed:topics` is idempotent: it updates titles, codes and
 * module assignment, and never duplicates or deletes a topic.
 */
import { loadLocalEnv } from "../src/shared/lib/load-env";
import type { CefrLevel } from "../src/shared/types";

loadLocalEnv();

interface SeedTopic {
  slug: string;
  title: string;
  ord: number;
  code?: string;
  unit: string;
  unitOrder: number;
  level: CefrLevel;
}

const FUNDAMENTOS = "1 · Fundamentos: to be, pronombres, artículos y lugar";
const PRESENT_SIMPLE = "6 · Present simple";
const CAN = "7 · Can: habilidad y permiso";
const CONTINUOUS = "8 · Present continuous e imperativos";
const PAST_BE = "9 · Pasado de to be (was / were)";
const VOCAB = "10 · Vocabulario esencial (A1-A2)";
const PAST_FUTURE = "11 · Pasado y futuro";
const QUANTITY = "12 · Cantidad y comparación";
const EXPERIENCE = "13 · Experiencia y obligación";
const VERBS = "14 · Verbos y condicionales";
const PRONOUNS = "15 · Pronombres";
const LIFE = "16 · Vocabulario: vida cotidiana";
const WORLD = "17 · Vocabulario: entorno y personas";

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
  {
    slug: "past-be-affirmative",
    title: "Pasado de to be afirmativo: was (I, he, she, it) y were (you, we, they) para estados y lugares en el pasado",
    ord: 17,
    code: "9.1",
    unit: PAST_BE,
    unitOrder: 9,
    level: "A2",
  },
  {
    slug: "past-be-negative-questions",
    title: "Pasado de to be negativo e interrogativo: wasn't / weren't, inversión, respuestas cortas y preguntas abiertas",
    ord: 18,
    code: "9.2",
    unit: PAST_BE,
    unitOrder: 9,
    level: "A2",
  },
  {
    slug: "past-be-context-contrast",
    title: "Práctica en contexto y contraste con el presente: narración breve y am/is/are → was/were",
    ord: 19,
    code: "9.3",
    unit: PAST_BE,
    unitOrder: 9,
    level: "A2",
  },
  {
    slug: "numbers-days-months",
    title: "Números cardinales (0-100 y base de mil), días de la semana, meses del año y expresiones de tiempo",
    ord: 20,
    code: "10.1",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "ordinals-dates-time",
    title: "Números ordinales (1st-31st), fechas en formato británico y estadounidense, y la hora (o'clock, half past, quarter to)",
    ord: 21,
    code: "10.2",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "countries-nationalities-languages",
    title: "Países, nacionalidades (-ish, -an, -ian, -ese) e idiomas: diferencia entre nacionalidad y lengua",
    ord: 22,
    code: "10.3",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "family-appearance-body",
    title: "Familia nuclear y extendida, partes del cuerpo y del rostro, y adjetivos de apariencia física",
    ord: 23,
    code: "10.4",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "objects-colors-clothes-home",
    title: "Objetos personales y de oficina, colores, prendas de vestir y habitaciones con mobiliario esencial",
    ord: 24,
    code: "10.5",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "food-drinks-daily-routines",
    title: "Alimentos, frutas, verduras y bebidas, comidas del día y verbos de rutina (wake up, have lunch, go to bed)",
    ord: 25,
    code: "10.6",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "jobs-places-city",
    title: "Profesiones comunes con a/an y lugares de la ciudad (hospital, bank, supermarket, station, park)",
    ord: 26,
    code: "10.7",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  // ── Módulo 11 · Pasado y futuro ──
  { slug: "past-simple-used-to", title: "Pasado simple y used to: regulares (-ed) e irregulares, didn't y Did...?, hábitos que ya no ocurren", ord: 27, code: "11.1", unit: PAST_FUTURE, unitOrder: 11, level: "B1" },
  { slug: "past-continuous-when-while", title: "Pasado continuo (was/were + -ing) y contraste con pasado simple mediante when y while", ord: 28, code: "11.2", unit: PAST_FUTURE, unitOrder: 11, level: "B1" },
  { slug: "future-expressions", title: "Be going to, will y presente continuo: planes, decisiones espontáneas, promesas y acuerdos con hora", ord: 29, code: "11.3", unit: PAST_FUTURE, unitOrder: 11, level: "B1" },
  // ── Módulo 12 · Cantidad y comparación ──
  { slug: "countable-uncountable-quantifiers", title: "Contables e incontables (water, money, advice) con some/any, much/many/a lot of, a few y a little", ord: 30, code: "12.1", unit: QUANTITY, unitOrder: 12, level: "B1" },
  { slug: "comparatives-superlatives", title: "Comparativos y superlativos (-er/more, the -est/the most), irregulares y as...as / not as...as", ord: 31, code: "12.2", unit: QUANTITY, unitOrder: 12, level: "B1" },
  // ── Módulo 13 · Experiencia y obligación ──
  { slug: "present-perfect-simple", title: "Presente perfecto (have/has + participio): ever/never, just/already/yet, for y since", ord: 32, code: "13.1", unit: EXPERIENCE, unitOrder: 13, level: "B1" },
  { slug: "modals-obligation-advice-possibility", title: "Modales: have to vs must, don't have to vs mustn't, should y might", ord: 33, code: "13.2", unit: EXPERIENCE, unitOrder: 13, level: "B1" },
  // ── Módulo 14 · Verbos y condicionales ──
  { slug: "gerund-infinitive", title: "Gerundio e infinitivo: verbos con -ing (enjoy, avoid, suggest) y con to + verbo (want, decide, plan)", ord: 34, code: "14.1", unit: VERBS, unitOrder: 14, level: "B1" },
  { slug: "conditionals-0-1", title: "Condicionales 0 (If + presente, presente) y 1 (If + presente, will + verbo)", ord: 35, code: "14.2", unit: VERBS, unitOrder: 14, level: "B1" },
  // ── Módulo 15 · Pronombres ──
  { slug: "object-possessive-pronouns", title: "Pronombres objeto (me, him, them) y posesivos (mine, yours) frente a adjetivos posesivos", ord: 36, code: "15.1", unit: PRONOUNS, unitOrder: 15, level: "B1" },
  // ── Módulo 16 · Vocabulario: vida cotidiana ──
  { slug: "travel-transport-accommodation", title: "Viajes, transporte y alojamiento: flight, ticket, platform, check-in, hotel/hostel, equipaje", ord: 37, code: "16.1", unit: LIFE, unitOrder: 16, level: "A2" },
  { slug: "shopping-money-stores", title: "Compras, dinero y tiendas: receipt, cash, card, discount, afford, spend, borrow, lend", ord: 38, code: "16.2", unit: LIFE, unitOrder: 16, level: "A2" },
  { slug: "health-symptoms-lifestyle", title: "Salud, síntomas y estilo de vida: headache, fever, sore throat, sleep, stress, balanced diet", ord: 39, code: "16.3", unit: LIFE, unitOrder: 16, level: "A2" },
  // ── Módulo 17 · Vocabulario: entorno y personas ──
  { slug: "weather-seasons-nature", title: "Clima, estaciones y naturaleza: sunny, storm, breeze, temperature, mountain, river, coast", ord: 40, code: "17.1", unit: WORLD, unitOrder: 17, level: "A2" },
  { slug: "sports-leisure-technology", title: "Deportes, ocio y tecnología: go + -ing, play, do; password, upload, download, app, Wi-Fi", ord: 41, code: "17.2", unit: WORLD, unitOrder: 17, level: "A2" },
  { slug: "personality-feelings", title: "Personalidad y sentimientos: shy, outgoing, generous, nervous, relieved, disappointed", ord: 42, code: "17.3", unit: WORLD, unitOrder: 17, level: "A2" },
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
