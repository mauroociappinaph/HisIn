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

const FUNDAMENTOS = "1 · Foundations: to be, pronouns, articles and place";
const PRESENT_SIMPLE = "6 · Present simple";
const CAN = "7 · Can: ability and permission";
const CONTINUOUS = "8 · Present continuous and imperatives";
const PAST_BE = "9 · Past of to be (was / were)";
const VOCAB = "10 · Essential vocabulary (A1-A2)";
const PAST_FUTURE = "11 · Past and future";
const QUANTITY = "12 · Quantity and comparison";
const EXPERIENCE = "13 · Experience and obligation";
const VERBS = "14 · Verbs and conditionals";
const PRONOUNS = "15 · Pronouns";
const LIFE = "16 · Vocabulary: everyday life";
const WORLD = "17 · Vocabulary: world and people";

const TOPICS: SeedTopic[] = [
  {
    slug: "verb-to-be",
    title: "Verb to be: affirmative, negative and questions",
    ord: 1,
    code: "1.1",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "subject-pronouns-possessives",
    title: "Subject pronouns and possessive adjectives",
    ord: 2,
    code: "1.2",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "articles-and-plurals",
    title: "Indefinite and definite articles, plurals",
    ord: 3,
    code: "1.3",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "demonstratives",
    title: "Demonstratives",
    ord: 4,
    code: "1.4",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "there-is-there-are-prepositions",
    title: "There is / there are and prepositions of place",
    ord: 5,
    code: "1.5",
    unit: FUNDAMENTOS,
    unitOrder: 1,
    level: "A2",
  },
  {
    slug: "present-simple-affirmative",
    title: "Present simple: affirmative and uses",
    ord: 6,
    code: "6.1",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "present-simple-negative-questions",
    title: "Present simple: negatives and questions",
    ord: 7,
    code: "6.2",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "present-simple-adverbs-frequency",
    title: "Present simple: adverbs of frequency",
    ord: 8,
    code: "6.3",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "present-simple-exceptions-integration",
    title: "Present simple: exceptions and integration",
    ord: 9,
    code: "6.4",
    unit: PRESENT_SIMPLE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "can-structure",
    title: "Can: structure and the rules of a modal",
    ord: 10,
    code: "7.1",
    unit: CAN,
    unitOrder: 7,
    level: "A2",
  },
  {
    slug: "can-ability-permission",
    title: "Can: ability and permission",
    ord: 11,
    code: "7.2",
    unit: CAN,
    unitOrder: 7,
    level: "A2",
  },
  {
    slug: "can-pronunciation-integration",
    title: "Can: pronunciation and integration",
    ord: 12,
    code: "7.3",
    unit: CAN,
    unitOrder: 7,
    level: "A2",
  },
  {
    slug: "present-continuous-affirmative",
    title: "Present continuous: affirmative and -ing spelling",
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
    title: "Imperatives: affirmative and negative",
    ord: 15,
    code: "8.3",
    unit: CONTINUOUS,
    unitOrder: 8,
    level: "A2",
  },
  {
    slug: "continuous-vs-imperative",
    title: "Present continuous vs. imperatives",
    ord: 16,
    code: "8.4",
    unit: CONTINUOUS,
    unitOrder: 8,
    level: "A2",
  },
  {
    slug: "past-be-affirmative",
    title: "Past of to be: affirmative",
    ord: 17,
    code: "9.1",
    unit: PAST_BE,
    unitOrder: 9,
    level: "A2",
  },
  {
    slug: "past-be-negative-questions",
    title: "Past of to be: negatives and questions",
    ord: 18,
    code: "9.2",
    unit: PAST_BE,
    unitOrder: 9,
    level: "A2",
  },
  {
    slug: "past-be-context-contrast",
    title: "Past of to be in context and in contrast",
    ord: 19,
    code: "9.3",
    unit: PAST_BE,
    unitOrder: 9,
    level: "A2",
  },
  {
    slug: "numbers-days-months",
    title: "Cardinal numbers, days and months",
    ord: 20,
    code: "10.1",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "ordinals-dates-time",
    title: "Ordinals, dates and the time",
    ord: 21,
    code: "10.2",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "countries-nationalities-languages",
    title: "Countries, nationalities and languages",
    ord: 22,
    code: "10.3",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "family-appearance-body",
    title: "Family, appearance and the body",
    ord: 23,
    code: "10.4",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "objects-colors-clothes-home",
    title: "Objects, colours, clothes and home",
    ord: 24,
    code: "10.5",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "food-drinks-daily-routines",
    title: "Food, drinks and daily routines",
    ord: 25,
    code: "10.6",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  {
    slug: "jobs-places-city",
    title: "Jobs, places and the city",
    ord: 26,
    code: "10.7",
    unit: VOCAB,
    unitOrder: 10,
    level: "A1",
  },
  // ── Módulo 11 · Pasado y futuro ──
  { slug: "past-simple-used-to", title: "Past simple and used to", ord: 27, code: "11.1", unit: PAST_FUTURE, unitOrder: 11, level: "B1" },
  { slug: "past-continuous-when-while", title: "Past continuous with when and while", ord: 28, code: "11.2", unit: PAST_FUTURE, unitOrder: 11, level: "B1" },
  { slug: "future-expressions", title: "Future expressions", ord: 29, code: "11.3", unit: PAST_FUTURE, unitOrder: 11, level: "B1" },
  // ── Módulo 12 · Cantidad y comparación ──
  { slug: "countable-uncountable-quantifiers", title: "Countable, uncountable and quantifiers", ord: 30, code: "12.1", unit: QUANTITY, unitOrder: 12, level: "B1" },
  { slug: "comparatives-superlatives", title: "Comparatives and superlatives", ord: 31, code: "12.2", unit: QUANTITY, unitOrder: 12, level: "B1" },
  // ── Módulo 13 · Experiencia y obligación ──
  { slug: "present-perfect-simple", title: "Present perfect simple", ord: 32, code: "13.1", unit: EXPERIENCE, unitOrder: 13, level: "B1" },
  { slug: "modals-obligation-advice-possibility", title: "Modals obligation advice possibility", ord: 33, code: "13.2", unit: EXPERIENCE, unitOrder: 13, level: "B1" },
  // ── Módulo 14 · Verbos y condicionales ──
  { slug: "gerund-infinitive", title: "Gerund and infinitive", ord: 34, code: "14.1", unit: VERBS, unitOrder: 14, level: "B1" },
  { slug: "conditionals-0-1", title: "Conditionals 0 1", ord: 35, code: "14.2", unit: VERBS, unitOrder: 14, level: "B1" },
  // ── Módulo 15 · Pronombres ──
  { slug: "object-possessive-pronouns", title: "Object and possessive pronouns", ord: 36, code: "15.1", unit: PRONOUNS, unitOrder: 15, level: "B1" },
  // ── Módulo 16 · Vocabulario: vida cotidiana ──
  { slug: "travel-transport-accommodation", title: "Travel transport accommodation", ord: 37, code: "16.1", unit: LIFE, unitOrder: 16, level: "A2" },
  { slug: "shopping-money-stores", title: "Shopping money stores", ord: 38, code: "16.2", unit: LIFE, unitOrder: 16, level: "A2" },
  { slug: "health-symptoms-lifestyle", title: "Health symptoms lifestyle", ord: 39, code: "16.3", unit: LIFE, unitOrder: 16, level: "A2" },
  // ── Módulo 17 · Vocabulario: entorno y personas ──
  { slug: "weather-seasons-nature", title: "Weather seasons nature", ord: 40, code: "17.1", unit: WORLD, unitOrder: 17, level: "A2" },
  { slug: "sports-leisure-technology", title: "Sports, leisure and technology", ord: 41, code: "17.2", unit: WORLD, unitOrder: 17, level: "A2" },
  { slug: "personality-feelings", title: "Personality and feelings", ord: 42, code: "17.3", unit: WORLD, unitOrder: 17, level: "A2" },
  // ── Módulos 18-30: B1 y B2 (owner) ──
  { slug: "past-simple-vs-present-perfect", title: "Past simple vs. present perfect", ord: 43, code: "18.1", unit: "18 · Past: contrast and narration", unitOrder: 18, level: "B1" },
  { slug: "past-perfect-simple", title: "Past perfect simple", ord: 44, code: "18.2", unit: "18 · Past: contrast and narration", unitOrder: 18, level: "B1" },
  { slug: "used-to-vs-would", title: "Used to vs. would", ord: 45, code: "18.3", unit: "18 · Past: contrast and narration", unitOrder: 18, level: "B1" },
  { slug: "second-conditional", title: "Second conditional", ord: 46, code: "19.1", unit: "19 · Hypotheses, passive and reported speech", unitOrder: 19, level: "B1" },
  { slug: "passive-voice-basic", title: "The passive: basic", ord: 47, code: "19.2", unit: "19 · Hypotheses, passive and reported speech", unitOrder: 19, level: "B1" },
  { slug: "reported-speech-basic", title: "Reported speech: basic", ord: 48, code: "19.3", unit: "19 · Hypotheses, passive and reported speech", unitOrder: 19, level: "B1" },
  { slug: "defining-relative-clauses", title: "Defining relative clauses", ord: 49, code: "20.1", unit: "20 · Relatives, modals and connectors", unitOrder: 20, level: "B1" },
  { slug: "modals-deduction-present", title: "Modals of deduction in the present", ord: 50, code: "20.2", unit: "20 · Relatives, modals and connectors", unitOrder: 20, level: "B1" },
  { slug: "connectors-cause-contrast", title: "Connectors of cause, contrast and result", ord: 51, code: "20.3", unit: "20 · Relatives, modals and connectors", unitOrder: 20, level: "B1" },
  { slug: "phrasal-verbs-everyday", title: "Everyday phrasal verbs", ord: 52, code: "21.1", unit: "21 · Everyday phrasal verbs", unitOrder: 21, level: "B1" },
  { slug: "education-learning", title: "Education and learning", ord: 53, code: "22.1", unit: "22 · B1 vocabulary: education, work and life", unitOrder: 22, level: "B1" },
  { slug: "work-employment", title: "Work and employment", ord: 54, code: "22.2", unit: "22 · B1 vocabulary: education, work and life", unitOrder: 22, level: "B1" },
  { slug: "relationships-life-stages", title: "Relationships and life stages", ord: 55, code: "22.3", unit: "22 · B1 vocabulary: education, work and life", unitOrder: 22, level: "B1" },
  { slug: "media-film-literature", title: "Media, film and literature", ord: 56, code: "23.1", unit: "23 · B1 vocabulary: media, society and lexis", unitOrder: 23, level: "B1" },
  { slug: "environment-society", title: "Environment and society", ord: 57, code: "23.2", unit: "23 · B1 vocabulary: media, society and lexis", unitOrder: 23, level: "B1" },
  { slug: "word-formation", title: "Word formation", ord: 58, code: "23.3", unit: "23 · B1 vocabulary: media, society and lexis", unitOrder: 23, level: "B1" },
  { slug: "tenses-passive-advanced", title: "Tenses and the advanced passive", ord: 59, code: "24.1", unit: "24 · Advanced tenses and passive", unitOrder: 24, level: "B2" },
  { slug: "perfect-continuous", title: "Perfect continuous tenses", ord: 60, code: "24.2", unit: "24 · Advanced tenses and passive", unitOrder: 24, level: "B2" },
  { slug: "third-mixed-conditionals", title: "Third and mixed conditionals", ord: 61, code: "25.1", unit: "25 · Conditionals and wishes", unitOrder: 25, level: "B2" },
  { slug: "wish-if-only", title: "Wishes with I wish and if only", ord: 62, code: "25.2", unit: "25 · Conditionals and wishes", unitOrder: 25, level: "B2" },
  { slug: "perfect-modals", title: "Perfect modals", ord: 63, code: "26.1", unit: "26 · Perfect modals and causative", unitOrder: 26, level: "B2" },
  { slug: "causative-have-get", title: "Causative have and get", ord: 64, code: "26.2", unit: "26 · Perfect modals and causative", unitOrder: 26, level: "B2" },
  { slug: "non-defining-relative-clauses", title: "Non-defining relative clauses", ord: 65, code: "27.1", unit: "27 · Advanced relatives and reported speech", unitOrder: 27, level: "B2" },
  { slug: "reported-speech-advanced", title: "Reported speech: advanced", ord: 66, code: "27.2", unit: "27 · Advanced relatives and reported speech", unitOrder: 27, level: "B2" },
  { slug: "gerund-infinitive-meaning-change", title: "Gerund or infinitive: meaning change", ord: 67, code: "28.1", unit: "28 · Gerund and infinitive with a change of meaning", unitOrder: 28, level: "B2" },
  { slug: "economy-finance-business", title: "Economy, finance and business", ord: 68, code: "29.1", unit: "29 · B2 vocabulary: economy, science and justice", unitOrder: 29, level: "B2" },
  { slug: "science-technology-ai", title: "Science, technology and AI", ord: 69, code: "29.2", unit: "29 · B2 vocabulary: economy, science and justice", unitOrder: 29, level: "B2" },
  { slug: "crime-justice-rights", title: "Crime, justice and rights", ord: 70, code: "29.3", unit: "29 · B2 vocabulary: economy, science and justice", unitOrder: 29, level: "B2" },
  { slug: "art-culture-aesthetics", title: "Art, culture and aesthetics", ord: 71, code: "30.1", unit: "30 · B2 vocabulary: art, collocations and idioms", unitOrder: 30, level: "B2" },
  { slug: "collocations", title: "Lexical collocations", ord: 72, code: "30.2", unit: "30 · B2 vocabulary: art, collocations and idioms", unitOrder: 30, level: "B2" },
  { slug: "idioms-register", title: "Idioms and register", ord: 73, code: "30.3", unit: "30 · B2 vocabulary: art, collocations and idioms", unitOrder: 30, level: "B2" },
  // ── Módulos 31-39: C1, C2 y Business English ──
  { slug: "negative-inversion", title: "Negative and emphatic inversion", ord: 74, code: "31.1", unit: "31 · Emphasis and inversion (C1)", unitOrder: 31, level: "C1" },
  { slug: "cleft-sentences", title: "Cleft sentences", ord: 75, code: "31.2", unit: "31 · Emphasis and inversion (C1)", unitOrder: 31, level: "C1" },
  { slug: "conditional-inversion", title: "Inversion in formal conditionals", ord: 76, code: "31.3", unit: "31 · Emphasis and inversion (C1)", unitOrder: 31, level: "C1" },
  { slug: "ellipsis-substitution", title: "Ellipsis and substitution", ord: 77, code: "31.4", unit: "31 · Emphasis and inversion (C1)", unitOrder: 31, level: "C1" },
  { slug: "participle-clauses", title: "Participle clauses", ord: 78, code: "32.1", unit: "32 · Condensed syntax (C1)", unitOrder: 32, level: "C1" },
  { slug: "formal-subjunctive", title: "The formal subjunctive", ord: 79, code: "32.2", unit: "32 · Condensed syntax (C1)", unitOrder: 32, level: "C1" },
  { slug: "advanced-modal-nuance", title: "Advanced modal nuance", ord: 80, code: "32.3", unit: "32 · Condensed syntax (C1)", unitOrder: 32, level: "C1" },
  { slug: "impersonal-passive", title: "Impersonal passive and hedging", ord: 81, code: "32.4", unit: "32 · Condensed syntax (C1)", unitOrder: 32, level: "C1" },
  { slug: "academic-argumentative-lexis", title: "Academic and argumentative lexis", ord: 82, code: "33.1", unit: "33 · C1 lexis: analysis and nuance", unitOrder: 33, level: "C1" },
  { slug: "synonym-connotation", title: "Synonymy and connotation", ord: 83, code: "33.2", unit: "33 · C1 lexis: analysis and nuance", unitOrder: 33, level: "C1" },
  { slug: "psychology-emotions", title: "Psychology and complex emotions", ord: 84, code: "33.3", unit: "33 · C1 lexis: analysis and nuance", unitOrder: 33, level: "C1" },
  { slug: "politics-sociology-ethics", title: "International politics, sociology and ethics", ord: 85, code: "34.1", unit: "34 · C1 lexis: world and discourse", unitOrder: 34, level: "C1" },
  { slug: "idiomatic-phrasal-verbs", title: "Three-word and idiomatic phrasal verbs", ord: 86, code: "34.2", unit: "34 · C1 lexis: world and discourse", unitOrder: 34, level: "C1" },
  { slug: "binomials-metaphors", title: "Fixed binomials and metaphor", ord: 87, code: "34.3", unit: "34 · C1 lexis: world and discourse", unitOrder: 34, level: "C1" },
  { slug: "structural-precision", title: "Structural consolidation and precision", ord: 88, code: "35.1", unit: "35 · Precision and style (C2)", unitOrder: 35, level: "C2" },
  { slug: "thematization-word-order", title: "Thematisation and stylistic word order", ord: 89, code: "35.2", unit: "35 · Precision and style (C2)", unitOrder: 35, level: "C2" },
  { slug: "advanced-cohesion", title: "Advanced textual cohesion", ord: 90, code: "35.3", unit: "35 · Precision and style (C2)", unitOrder: 35, level: "C2" },
  { slug: "pragmatic-distance", title: "Pragmatics: politeness, irony and distance", ord: 91, code: "36.1", unit: "36 · Pragmatics and fixed formulas (C2)", unitOrder: 36, level: "C2" },
  { slug: "archaic-formulas", title: "Archaic and literary fixed formulas", ord: 92, code: "36.2", unit: "36 · Pragmatics and fixed formulas (C2)", unitOrder: 36, level: "C2" },
  { slug: "multidisciplinary-terminology", title: "Multidisciplinary specialist terminology", ord: 93, code: "37.1", unit: "37 · C2 lexis: specialist and cultural", unitOrder: 37, level: "C2" },
  { slug: "cultural-references", title: "Cultural, literary and historical references", ord: 94, code: "37.2", unit: "37 · C2 lexis: specialist and cultural", unitOrder: 37, level: "C2" },
  { slug: "dialect-regional-variation", title: "Dialectal variation and regionalisms", ord: 95, code: "37.3", unit: "37 · C2 lexis: specialist and cultural", unitOrder: 37, level: "C2" },
  { slug: "humour-irony-euphemism", title: "Humour, irony, sarcasm and euphemism", ord: 96, code: "38.1", unit: "38 · C2 lexis: humour and rhetoric", unitOrder: 38, level: "C2" },
  { slug: "rhetorical-figures", title: "Rhetorical figures and figurative language", ord: 97, code: "38.2", unit: "38 · C2 lexis: humour and rhetoric", unitOrder: 38, level: "C2" },
  { slug: "business-negotiation", title: "Business negotiation", ord: 98, code: "39.1", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  { slug: "executive-presentations", title: "Executive presentations", ord: 99, code: "39.2", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  { slug: "corporate-writing", title: "Corporate writing", ord: 100, code: "39.3", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  { slug: "intercultural-communication", title: "Intercultural communication", ord: 101, code: "39.4", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  // ── Módulo 40: Academic English (C1) ──
  { slug: "academic-register-objective-style", title: "Academic register and objective style", ord: 101, code: "40.1", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "cohesion-coherence-information-flow", title: "Cohesion, coherence and information flow", ord: 102, code: "40.2", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "critical-reading-source-management", title: "Critical reading, synthesis and sources", ord: 103, code: "40.3", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "introduction-and-literature-review", title: "Introduction and literature review", ord: 104, code: "40.4", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "methods-results-data-commentary", title: "Methods, results and data commentary", ord: 105, code: "40.5", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "discussion-limitations-conclusions", title: "Discussion, limitations and conclusions", ord: 106, code: "40.6", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "peer-review-and-editing", title: "Peer review and academic editing", ord: 107, code: "40.7", unit: "40 · Academic English", unitOrder: 40, level: "C1" },  { slug: "conference-talks-and-thesis-defence", title: "Conference talks and thesis defence", ord: 108, code: "40.8", unit: "40 · Academic English", unitOrder: 40, level: "C1" },
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
