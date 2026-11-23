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
  /** Optional line telling the engine what the submodule is for. */
  focus?: string;
}

const FUNDAMENTOS = "1 · Foundations: to be, pronouns, articles and place";
const PRESENT_SIMPLE = "3 · Present simple";
const CAN = "4 · Can: ability and permission";
const CONTINUOUS = "5 · Present continuous and imperatives";
const PAST_BE = "6 · Past of to be (was / were)";
const VOCAB = "2 · Essential vocabulary (A1-A2)";
const PAST_FUTURE = "9 · Past and future";
const QUANTITY = "10 · Quantity and comparison";
const EXPERIENCE = "11 · Experience and obligation";
const VERBS = "12 · Verbs and conditionals";
const PRONOUNS = "13 · Pronouns";
const LIFE = "7 · Vocabulary: everyday life";
const WORLD = "8 · Vocabulary: world and people";

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
    code: "3.1",
    unit: PRESENT_SIMPLE,
    unitOrder: 3,
    level: "A2",
  },
  {
    slug: "present-simple-negative-questions",
    title: "Present simple: negatives and questions",
    ord: 7,
    code: "3.2",
    unit: PRESENT_SIMPLE,
    unitOrder: 3,
    level: "A2",
  },
  {
    slug: "present-simple-adverbs-frequency",
    title: "Present simple: adverbs of frequency",
    ord: 8,
    code: "3.3",
    unit: PRESENT_SIMPLE,
    unitOrder: 3,
    level: "A2",
  },
  {
    slug: "present-simple-exceptions-integration",
    title: "Present simple: exceptions and integration",
    ord: 9,
    code: "3.4",
    unit: PRESENT_SIMPLE,
    unitOrder: 3,
    level: "A2",
  },
  {
    slug: "can-structure",
    title: "Can: structure and the rules of a modal",
    ord: 10,
    code: "4.1",
    unit: CAN,
    unitOrder: 4,
    level: "A2",
  },
  {
    slug: "can-ability-permission",
    title: "Can: ability and permission",
    ord: 11,
    code: "4.2",
    unit: CAN,
    unitOrder: 4,
    level: "A2",
  },
  {
    slug: "can-pronunciation-integration",
    title: "Can: pronunciation and integration",
    ord: 12,
    code: "4.3",
    unit: CAN,
    unitOrder: 4,
    level: "A2",
  },
  {
    slug: "present-continuous-affirmative",
    title: "Present continuous: affirmative and -ing spelling",
    ord: 13,
    code: "5.1",
    unit: CONTINUOUS,
    unitOrder: 5,
    level: "A2",
  },
  {
    slug: "present-continuous-negative-questions",
    title: "Present continuous negativo e interrogativo ('m not / isn't / aren't, Is she working?)",
    ord: 14,
    code: "5.2",
    unit: CONTINUOUS,
    unitOrder: 5,
    level: "A2",
  },
  {
    slug: "imperatives",
    title: "Imperatives: affirmative and negative",
    ord: 15,
    code: "5.3",
    unit: CONTINUOUS,
    unitOrder: 5,
    level: "A2",
  },
  {
    slug: "continuous-vs-imperative",
    title: "Present continuous vs. imperatives",
    ord: 16,
    code: "5.4",
    unit: CONTINUOUS,
    unitOrder: 5,
    level: "A2",
  },
  {
    slug: "past-be-affirmative",
    title: "Past of to be: affirmative",
    ord: 17,
    code: "6.1",
    unit: PAST_BE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "past-be-negative-questions",
    title: "Past of to be: negatives and questions",
    ord: 18,
    code: "6.2",
    unit: PAST_BE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "past-be-context-contrast",
    title: "Past of to be in context and in contrast",
    ord: 19,
    code: "6.3",
    unit: PAST_BE,
    unitOrder: 6,
    level: "A2",
  },
  {
    slug: "numbers-days-months",
    title: "Cardinal numbers, days and months",
    ord: 20,
    code: "2.1",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  {
    slug: "ordinals-dates-time",
    title: "Ordinals, dates and the time",
    ord: 21,
    code: "2.2",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  {
    slug: "countries-nationalities-languages",
    title: "Countries, nationalities and languages",
    ord: 22,
    code: "2.3",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  {
    slug: "family-appearance-body",
    title: "Family, appearance and the body",
    ord: 23,
    code: "2.4",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  {
    slug: "objects-colors-clothes-home",
    title: "Objects, colours, clothes and home",
    ord: 24,
    code: "2.5",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  {
    slug: "food-drinks-daily-routines",
    title: "Food, drinks and daily routines",
    ord: 25,
    code: "2.6",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  {
    slug: "jobs-places-city",
    title: "Jobs, places and the city",
    ord: 26,
    code: "2.7",
    unit: VOCAB,
    unitOrder: 2,
    level: "A1",
  },
  // ── Módulo 11 · Pasado y futuro ──
  { slug: "past-simple-used-to", title: "Past simple and used to", ord: 27, code: "9.1", unit: PAST_FUTURE, unitOrder: 9, level: "B1" },
  { slug: "past-continuous-when-while", title: "Past continuous with when and while", ord: 28, code: "9.2", unit: PAST_FUTURE, unitOrder: 9, level: "B1" },
  { slug: "future-expressions", title: "Future expressions", ord: 29, code: "9.3", unit: PAST_FUTURE, unitOrder: 9, level: "B1" },
  // ── Módulo 12 · Cantidad y comparación ──
  { slug: "countable-uncountable-quantifiers", title: "Countable, uncountable and quantifiers", ord: 30, code: "10.1", unit: QUANTITY, unitOrder: 10, level: "B1" },
  { slug: "comparatives-superlatives", title: "Comparatives and superlatives", ord: 31, code: "10.2", unit: QUANTITY, unitOrder: 10, level: "B1" },
  // ── Módulo 13 · Experiencia y obligación ──
  { slug: "present-perfect-simple", title: "Present perfect simple", ord: 32, code: "11.1", unit: EXPERIENCE, unitOrder: 11, level: "B1" },
  { slug: "modals-obligation-advice-possibility", title: "Modals obligation advice possibility", ord: 33, code: "11.2", unit: EXPERIENCE, unitOrder: 11, level: "B1" },
  // ── Módulo 14 · Verbos y condicionales ──
  { slug: "gerund-infinitive", title: "Gerund and infinitive", ord: 34, code: "12.1", unit: VERBS, unitOrder: 12, level: "B1" },
  { slug: "conditionals-0-1", title: "Conditionals 0 1", ord: 35, code: "12.2", unit: VERBS, unitOrder: 12, level: "B1" },
  // ── Módulo 15 · Pronombres ──
  { slug: "object-possessive-pronouns", title: "Object and possessive pronouns", ord: 36, code: "13.1", unit: PRONOUNS, unitOrder: 13, level: "B1" },
  // ── Módulo 16 · Vocabulario: vida cotidiana ──
  { slug: "travel-transport-accommodation", title: "Travel transport accommodation", ord: 37, code: "7.1", unit: LIFE, unitOrder: 7, level: "A2" },
  { slug: "shopping-money-stores", title: "Shopping money stores", ord: 38, code: "7.2", unit: LIFE, unitOrder: 7, level: "A2" },
  { slug: "health-symptoms-lifestyle", title: "Health symptoms lifestyle", ord: 39, code: "7.3", unit: LIFE, unitOrder: 7, level: "A2" },
  // ── Módulo 17 · Vocabulario: entorno y personas ──
  { slug: "weather-seasons-nature", title: "Weather seasons nature", ord: 40, code: "8.1", unit: WORLD, unitOrder: 8, level: "A2" },
  { slug: "sports-leisure-technology", title: "Sports, leisure and technology", ord: 41, code: "8.2", unit: WORLD, unitOrder: 8, level: "A2" },
  { slug: "personality-feelings", title: "Personality and feelings", ord: 42, code: "8.3", unit: WORLD, unitOrder: 8, level: "A2" },
  // ── Módulos 18-30: B1 y B2 (owner) ──
  { slug: "past-simple-vs-present-perfect", title: "Past simple vs. present perfect", ord: 43, code: "14.1", unit: "14 · Past: contrast and narration", unitOrder: 14, level: "B1" },
  { slug: "past-perfect-simple", title: "Past perfect simple", ord: 44, code: "14.2", unit: "14 · Past: contrast and narration", unitOrder: 14, level: "B1" },
  { slug: "used-to-vs-would", title: "Used to vs. would", ord: 45, code: "14.3", unit: "14 · Past: contrast and narration", unitOrder: 14, level: "B1" },
  { slug: "second-conditional", title: "Second conditional", ord: 46, code: "15.1", unit: "15 · Hypotheses, passive and reported speech", unitOrder: 15, level: "B1" },
  { slug: "passive-voice-basic", title: "The passive: basic", ord: 47, code: "15.2", unit: "15 · Hypotheses, passive and reported speech", unitOrder: 15, level: "B1" },
  { slug: "reported-speech-basic", title: "Reported speech: basic", ord: 48, code: "15.3", unit: "15 · Hypotheses, passive and reported speech", unitOrder: 15, level: "B1" },
  { slug: "defining-relative-clauses", title: "Defining relative clauses", ord: 49, code: "16.1", unit: "16 · Relatives, modals and connectors", unitOrder: 16, level: "B1" },
  { slug: "modals-deduction-present", title: "Modals of deduction in the present", ord: 50, code: "16.2", unit: "16 · Relatives, modals and connectors", unitOrder: 16, level: "B1" },
  { slug: "connectors-cause-contrast", title: "Connectors of cause, contrast and result", ord: 51, code: "16.3", unit: "16 · Relatives, modals and connectors", unitOrder: 16, level: "B1" },
  { slug: "phrasal-verbs-everyday", title: "Everyday phrasal verbs", ord: 52, code: "17.1", unit: "17 · Everyday phrasal verbs", unitOrder: 17, level: "B1" },
  { slug: "education-learning", title: "Education and learning", ord: 53, code: "18.1", unit: "18 · B1 vocabulary: education, work and life", unitOrder: 18, level: "B1" },
  { slug: "work-employment", title: "Work and employment", ord: 54, code: "18.2", unit: "18 · B1 vocabulary: education, work and life", unitOrder: 18, level: "B1" },
  { slug: "relationships-life-stages", title: "Relationships and life stages", ord: 55, code: "18.3", unit: "18 · B1 vocabulary: education, work and life", unitOrder: 18, level: "B1" },
  { slug: "media-film-literature", title: "Media, film and literature", ord: 56, code: "19.1", unit: "19 · B1 vocabulary: media, society and lexis", unitOrder: 19, level: "B1" },
  { slug: "environment-society", title: "Environment and society", ord: 57, code: "19.2", unit: "19 · B1 vocabulary: media, society and lexis", unitOrder: 19, level: "B1" },
  { slug: "word-formation", title: "Word formation", ord: 58, code: "19.3", unit: "19 · B1 vocabulary: media, society and lexis", unitOrder: 19, level: "B1" },
  { slug: "tenses-passive-advanced", title: "Tenses and the advanced passive", ord: 59, code: "20.1", unit: "20 · Advanced tenses and passive", unitOrder: 20, level: "B2" },
  { slug: "perfect-continuous", title: "Perfect continuous tenses", ord: 60, code: "20.2", unit: "20 · Advanced tenses and passive", unitOrder: 20, level: "B2" },
  { slug: "third-mixed-conditionals", title: "Third and mixed conditionals", ord: 61, code: "21.1", unit: "21 · Conditionals and wishes", unitOrder: 21, level: "B2" },
  { slug: "wish-if-only", title: "Wishes with I wish and if only", ord: 62, code: "21.2", unit: "21 · Conditionals and wishes", unitOrder: 21, level: "B2" },
  { slug: "perfect-modals", title: "Perfect modals", ord: 63, code: "22.1", unit: "22 · Perfect modals and causative", unitOrder: 22, level: "B2" },
  { slug: "causative-have-get", title: "Causative have and get", ord: 64, code: "22.2", unit: "22 · Perfect modals and causative", unitOrder: 22, level: "B2" },
  { slug: "non-defining-relative-clauses", title: "Non-defining relative clauses", ord: 65, code: "23.1", unit: "23 · Advanced relatives and reported speech", unitOrder: 23, level: "B2" },
  { slug: "reported-speech-advanced", title: "Reported speech: advanced", ord: 66, code: "23.2", unit: "23 · Advanced relatives and reported speech", unitOrder: 23, level: "B2" },
  { slug: "gerund-infinitive-meaning-change", title: "Gerund or infinitive: meaning change", ord: 67, code: "24.1", unit: "24 · Gerund and infinitive with a change of meaning", unitOrder: 24, level: "B2" },
  { slug: "economy-finance-business", title: "Economy, finance and business", ord: 68, code: "25.1", unit: "25 · B2 vocabulary: economy, science and justice", unitOrder: 25, level: "B2" },
  { slug: "science-technology-ai", title: "Science, technology and AI", ord: 69, code: "25.2", unit: "25 · B2 vocabulary: economy, science and justice", unitOrder: 25, level: "B2" },
  { slug: "crime-justice-rights", title: "Crime, justice and rights", ord: 70, code: "25.3", unit: "25 · B2 vocabulary: economy, science and justice", unitOrder: 25, level: "B2" },
  { slug: "art-culture-aesthetics", title: "Art, culture and aesthetics", ord: 71, code: "26.1", unit: "26 · B2 vocabulary: art, collocations and idioms", unitOrder: 26, level: "B2" },
  { slug: "collocations", title: "Lexical collocations", ord: 72, code: "26.2", unit: "26 · B2 vocabulary: art, collocations and idioms", unitOrder: 26, level: "B2" },
  { slug: "idioms-register", title: "Idioms and register", ord: 73, code: "26.3", unit: "26 · B2 vocabulary: art, collocations and idioms", unitOrder: 26, level: "B2" },
  // ── Módulos 31-39: C1, C2 y Business English ──
  { slug: "negative-inversion", title: "Negative and emphatic inversion", ord: 74, code: "27.1", unit: "27 · Emphasis and inversion (C1)", unitOrder: 27, level: "C1" },
  { slug: "cleft-sentences", title: "Cleft sentences", ord: 75, code: "27.2", unit: "27 · Emphasis and inversion (C1)", unitOrder: 27, level: "C1" },
  { slug: "conditional-inversion", title: "Inversion in formal conditionals", ord: 76, code: "27.3", unit: "27 · Emphasis and inversion (C1)", unitOrder: 27, level: "C1" },
  { slug: "ellipsis-substitution", title: "Ellipsis and substitution", ord: 77, code: "27.4", unit: "27 · Emphasis and inversion (C1)", unitOrder: 27, level: "C1" },
  { slug: "participle-clauses", title: "Participle clauses", ord: 78, code: "28.1", unit: "28 · Condensed syntax (C1)", unitOrder: 28, level: "C1" },
  { slug: "formal-subjunctive", title: "The formal subjunctive", ord: 79, code: "28.2", unit: "28 · Condensed syntax (C1)", unitOrder: 28, level: "C1" },
  { slug: "advanced-modal-nuance", title: "Advanced modal nuance", ord: 80, code: "28.3", unit: "28 · Condensed syntax (C1)", unitOrder: 28, level: "C1" },
  { slug: "impersonal-passive", title: "Impersonal passive and hedging", ord: 81, code: "28.4", unit: "28 · Condensed syntax (C1)", unitOrder: 28, level: "C1" },
  { slug: "academic-argumentative-lexis", title: "Academic and argumentative lexis", ord: 82, code: "29.1", unit: "29 · C1 lexis: analysis and nuance", unitOrder: 29, level: "C1" },
  { slug: "synonym-connotation", title: "Synonymy and connotation", ord: 83, code: "29.2", unit: "29 · C1 lexis: analysis and nuance", unitOrder: 29, level: "C1" },
  { slug: "psychology-emotions", title: "Psychology and complex emotions", ord: 84, code: "29.3", unit: "29 · C1 lexis: analysis and nuance", unitOrder: 29, level: "C1" },
  { slug: "politics-sociology-ethics", title: "International politics, sociology and ethics", ord: 85, code: "30.1", unit: "30 · C1 lexis: world and discourse", unitOrder: 30, level: "C1" },
  { slug: "idiomatic-phrasal-verbs", title: "Three-word and idiomatic phrasal verbs", ord: 86, code: "30.2", unit: "30 · C1 lexis: world and discourse", unitOrder: 30, level: "C1" },
  { slug: "binomials-metaphors", title: "Fixed binomials and metaphor", ord: 87, code: "30.3", unit: "30 · C1 lexis: world and discourse", unitOrder: 30, level: "C1" },
  { slug: "structural-precision", title: "Structural consolidation and precision", ord: 88, code: "31.1", unit: "31 · Precision and style (C2)", unitOrder: 31, level: "C2" },
  { slug: "thematization-word-order", title: "Thematisation and stylistic word order", ord: 89, code: "31.2", unit: "31 · Precision and style (C2)", unitOrder: 31, level: "C2" },
  { slug: "advanced-cohesion", title: "Advanced textual cohesion", ord: 90, code: "31.3", unit: "31 · Precision and style (C2)", unitOrder: 31, level: "C2" },
  { slug: "pragmatic-distance", title: "Pragmatics: politeness, irony and distance", ord: 91, code: "32.1", unit: "32 · Pragmatics and fixed formulas (C2)", unitOrder: 32, level: "C2" },
  { slug: "archaic-formulas", title: "Archaic and literary fixed formulas", ord: 92, code: "32.2", unit: "32 · Pragmatics and fixed formulas (C2)", unitOrder: 32, level: "C2" },
  { slug: "multidisciplinary-terminology", title: "Multidisciplinary specialist terminology", ord: 93, code: "33.1", unit: "33 · C2 lexis: specialist and cultural", unitOrder: 33, level: "C2" },
  { slug: "cultural-references", title: "Cultural, literary and historical references", ord: 94, code: "33.2", unit: "33 · C2 lexis: specialist and cultural", unitOrder: 33, level: "C2" },
  { slug: "dialect-regional-variation", title: "Dialectal variation and regionalisms", ord: 95, code: "33.3", unit: "33 · C2 lexis: specialist and cultural", unitOrder: 33, level: "C2" },
  { slug: "humour-irony-euphemism", title: "Humour, irony, sarcasm and euphemism", ord: 96, code: "34.1", unit: "34 · C2 lexis: humour and rhetoric", unitOrder: 34, level: "C2" },
  { slug: "rhetorical-figures", title: "Rhetorical figures and figurative language", ord: 97, code: "34.2", unit: "34 · C2 lexis: humour and rhetoric", unitOrder: 34, level: "C2" },
  { slug: "business-negotiation", title: "Business negotiation", ord: 98, code: "36.1", unit: "36 · Business English", unitOrder: 36, level: "B2" },
  { slug: "executive-presentations", title: "Executive presentations", ord: 99, code: "36.2", unit: "36 · Business English", unitOrder: 36, level: "B2" },
  { slug: "corporate-writing", title: "Corporate writing", ord: 100, code: "36.3", unit: "36 · Business English", unitOrder: 36, level: "B2" },
  { slug: "intercultural-communication", title: "Intercultural communication", ord: 101, code: "36.4", unit: "36 · Business English", unitOrder: 36, level: "B2" },
  // ── Módulo 40: Academic English (C1) ──
  { slug: "academic-register-objective-style", title: "Academic register and objective style", ord: 101, code: "37.1", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "cohesion-coherence-information-flow", title: "Cohesion, coherence and information flow", ord: 102, code: "37.2", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "critical-reading-source-management", title: "Critical reading, synthesis and sources", ord: 103, code: "37.3", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "introduction-and-literature-review", title: "Introduction and literature review", ord: 104, code: "37.4", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "methods-results-data-commentary", title: "Methods, results and data commentary", ord: 105, code: "37.5", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "discussion-limitations-conclusions", title: "Discussion, limitations and conclusions", ord: 106, code: "37.6", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "peer-review-and-editing", title: "Peer review and academic editing", ord: 107, code: "37.7", unit: "37 · Academic English", unitOrder: 37, level: "C1" },  { slug: "conference-talks-and-thesis-defence", title: "Conference talks and thesis defence", ord: 108, code: "37.8", unit: "37 · Academic English", unitOrder: 37, level: "C1" },
  // ── Módulos 41-44: inglés profesional por dominio ──
  { slug: "medical-anatomy-physiology-lexis", title: "Anatomy, physiology and clinical lexis", ord: 110, code: "39.1", unit: "39 · Medical English", unitOrder: 39, level: "B2" },
  { slug: "clinical-interview-patient-communication", title: "The clinical interview and patient communication", ord: 111, code: "39.2", unit: "39 · Medical English", unitOrder: 39, level: "B2" },
  { slug: "medical-documentation-pharmacology", title: "Medical documentation and pharmacology", ord: 112, code: "39.3", unit: "39 · Medical English", unitOrder: 39, level: "B2" },
  { slug: "clinical-cases-biomedical-literature", title: "Clinical cases and biomedical literature", ord: 113, code: "39.4", unit: "39 · Medical English", unitOrder: 39, level: "B2" },
  { slug: "legal-systems-core-terminology", title: "Legal systems and core terminology", ord: 114, code: "40.1", unit: "40 · Legal English", unitOrder: 40, level: "B2" },
  { slug: "contract-language-standard-clauses", title: "Contract language and standard clauses", ord: 115, code: "40.2", unit: "40 · Legal English", unitOrder: 40, level: "B2" },
  { slug: "corporate-law-ip-disputes", title: "Corporate law, intellectual property and disputes", ord: 116, code: "40.3", unit: "40 · Legal English", unitOrder: 40, level: "B2" },
  { slug: "legal-correspondence-oral-advocacy", title: "Legal correspondence and oral advocacy", ord: 117, code: "40.4", unit: "40 · Legal English", unitOrder: 40, level: "B2" },
  { slug: "icao-alphabet-standard-phraseology", title: "ICAO alphabet, numbers and standard phraseology", ord: 118, code: "41.1", unit: "41 · Aviation English", unitOrder: 41, level: "B2" },
  { slug: "flight-operations-atc", title: "Flight operations and air traffic control", ord: 119, code: "41.2", unit: "41 · Aviation English", unitOrder: 41, level: "B2" },
  { slug: "aviation-meteorology-navigation", title: "Aviation meteorology and navigation", ord: 120, code: "41.3", unit: "41 · Aviation English", unitOrder: 41, level: "B2" },
  { slug: "aviation-emergencies-plain-english", title: "Abnormal situations, emergencies and plain English", ord: 121, code: "41.4", unit: "41 · Aviation English", unitOrder: 41, level: "B2" },
  { slug: "architecture-infrastructure-code", title: "Architecture, infrastructure and code", ord: 122, code: "42.1", unit: "42 · Tech and software English", unitOrder: 42, level: "B2" },
  { slug: "agile-ceremonies-team-talk", title: "Agile methods and team ceremonies", ord: 123, code: "42.2", unit: "42 · Tech and software English", unitOrder: 42, level: "B2" },
  { slug: "technical-documentation-writing", title: "Technical documentation and written communication", ord: 124, code: "42.3", unit: "42 · Tech and software English", unitOrder: 42, level: "B2" },
  { slug: "technical-talks-incident-response", title: "Technical talks, architecture and incident response", ord: 125, code: "42.4", unit: "42 · Tech and software English", unitOrder: 42, level: "B2" },
  // ── Módulo 45: exámenes internacionales ──
  { slug: "exam-architecture-cefr-mapping", title: "Exam architecture and CEFR mapping", ord: 125, code: "38.1", unit: "38 · Exam and certification English", unitOrder: 38, level: "C1" },
  { slug: "writing-rubrics-task-and-coherence", title: "Writing rubrics: task, content and coherence", ord: 126, code: "38.2", unit: "38 · Exam and certification English", unitOrder: 38, level: "C1" },
  { slug: "writing-rubrics-lexis-and-grammar", title: "Writing rubrics: lexis and grammatical range", ord: 127, code: "38.3", unit: "38 · Exam and certification English", unitOrder: 38, level: "C1" },
  { slug: "speaking-rubrics-fluency-and-pronunciation", title: "Speaking rubrics: fluency, discourse and pronunciation", ord: 128, code: "38.4", unit: "38 · Exam and certification English", unitOrder: 38, level: "C1" },
  { slug: "speaking-rubrics-grammar-and-vocabulary", title: "Speaking rubrics: grammar and vocabulary under pressure", ord: 129, code: "38.5", unit: "38 · Exam and certification English", unitOrder: 38, level: "C1" },
  // ── Módulo 35: arquitectura de fluidez B1→C1 ──
  { slug: "connectors-precision", title: "Connectors: cause, contrast and result instead of and/but", ord: 130, code: "35.1", unit: "35 · Fluency architecture: B1 to C1", unitOrder: 35, level: "B2", focus: "Replace 'and', 'but', 'because' and 'so' with precise connectors of cause, contrast and result, so a deadline slip reads as a diagnosis instead of an excuse." },
  { slug: "precise-verbs-phrasal", title: "Precise verbs and phrasal verbs instead of make/do/get", ord: 131, code: "35.2", unit: "35 · Fluency architecture: B1 to C1", unitOrder: 35, level: "B2", focus: "Swap generic verbs (make, do, get, fix) for exact action verbs and phrasal verbs, so 'fix the problem' becomes 'resolve the bottleneck'." },
  { slug: "past-modals-nuance", title: "Past modals: deduction and criticism", ord: 132, code: "35.3", unit: "35 · Fluency architecture: B1 to C1", unitOrder: 35, level: "B2", focus: "Go beyond can, should and must with past modals: 'it must have been a cache issue', 'we should have deployed earlier'." },
  { slug: "passive-reporting-systems", title: "Passive voice for processes and systems", ord: 133, code: "35.4", unit: "35 · Fluency architecture: B1 to C1", unitOrder: 35, level: "B2", focus: "Report what happens to a system when the actor does not matter: 'the payload is encrypted before it is sent to the server'." },
  // ── Módulo 43: calibración de examinador ──
  { slug: "examiner-requirements-ethics", title: "Examiner requirements, ethics and governance", ord: 134, code: "43.1", unit: "43 · Examiner calibration and diagnostic feedback", unitOrder: 43, level: "C1" },
  { slug: "interlocutor-assessor-roles", title: "Room roles and oral format management", ord: 135, code: "43.2", unit: "43 · Examiner calibration and diagnostic feedback", unitOrder: 43, level: "C1" },
  { slug: "oral-assessment-scales", title: "Oral assessment scales and official descriptors", ord: 136, code: "43.3", unit: "43 · Examiner calibration and diagnostic feedback", unitOrder: 43, level: "C1" },
  { slug: "standardisation-bias-control", title: "Standardisation, calibration and bias control", ord: 137, code: "43.4", unit: "43 · Examiner calibration and diagnostic feedback", unitOrder: 43, level: "C1" },
  { slug: "room-simulation-incidents", title: "Room simulation and incident handling", ord: 138, code: "43.5", unit: "43 · Examiner calibration and diagnostic feedback", unitOrder: 43, level: "C1" },
  // ── Módulo 44: formación docente y análisis del lenguaje ──
  { slug: "pedagogical-grammar-discourse-analysis", title: "Pedagogical grammar and discourse analysis", ord: 139, code: "44.1", unit: "44 · Teacher development and language analysis", unitOrder: 44, level: "C2" },
  { slug: "advanced-phonology-suprasegmentals", title: "Advanced phonology and suprasegmental features", ord: 140, code: "44.2", unit: "44 · Teacher development and language analysis", unitOrder: 44, level: "C2" },
  { slug: "sla-diagnosis-error-treatment", title: "Second language acquisition, diagnosis and error treatment", ord: 141, code: "44.3", unit: "44 · Teacher development and language analysis", unitOrder: 44, level: "C2" },
  // ── Módulo 44 (continuación): didáctica, currículum y desarrollo profesional ──
  { slug: "methodological-approaches-reflective-practice", title: "Methodological approaches and reflective practice", ord: 142, code: "44.4", unit: "44 · Teacher development and language analysis", unitOrder: 44, level: "C2" },
  { slug: "curriculum-design-program-evaluation", title: "Curriculum design and programme evaluation", ord: 143, code: "44.5", unit: "44 · Teacher development and language analysis", unitOrder: 44, level: "C2" },
  { slug: "professional-development-academic-writing", title: "Professional development and academic writing", ord: 144, code: "44.6", unit: "44 · Teacher development and language analysis", unitOrder: 44, level: "C2" },
  // ── Módulo 45: lingüística aplicada (posgrado) ──
  { slug: "applied-linguistics-corpus-analysis", title: "Applied linguistics, discourse and corpus analysis", ord: 145, code: "45.1", unit: "45 · Postgraduate applied linguistics", unitOrder: 45, level: "C2" },
  { slug: "psycholinguistics-second-language-acquisition", title: "Psycholinguistics and second language acquisition", ord: 146, code: "45.2", unit: "45 · Postgraduate applied linguistics", unitOrder: 45, level: "C2" },
  { slug: "sociolinguistics-multilingualism-identity", title: "Sociolinguistics, multilingualism and identity", ord: 147, code: "45.3", unit: "45 · Postgraduate applied linguistics", unitOrder: 45, level: "C2" },
  { slug: "language-policy-educational-planning", title: "Educational policy and language planning", ord: 148, code: "45.4", unit: "45 · Postgraduate applied linguistics", unitOrder: 45, level: "C2" },
  // ── Módulo 46: diseño curricular y producción de materiales ──
  { slug: "needs-analysis-syllabus-design", title: "Needs analysis and syllabus design", ord: 149, code: "46.1", unit: "46 · Curriculum design and materials production", unitOrder: 46, level: "C2" },
  { slug: "materials-design-and-adaptation", title: "Principles of materials design and adaptation", ord: 150, code: "46.2", unit: "46 · Curriculum design and materials production", unitOrder: 46, level: "C2" },
  { slug: "textbook-writing-unit-design", title: "Textbook writing and unit design", ord: 151, code: "46.3", unit: "46 · Curriculum design and materials production", unitOrder: 46, level: "C2" },
  { slug: "multimodal-digital-accessibility", title: "Multimodal, digital design and accessibility", ord: 152, code: "46.4", unit: "46 · Curriculum design and materials production", unitOrder: 46, level: "C2" },
  { slug: "language-testing-assessment-foundations", title: "Foundations of language testing and assessment", ord: 153, code: "46.5", unit: "46 · Curriculum design and materials production", unitOrder: 46, level: "C2" },
  { slug: "performance-assessment-piloting-calibration", title: "Performance assessment, piloting and item calibration", ord: 154, code: "46.6", unit: "46 · Curriculum design and materials production", unitOrder: 46, level: "C2" },
  // ── Módulo 47: arquitectura aplicada de cursos de inglés online ──
  { slug: "efl-course-architecture-cefr", title: "English course architecture: CEFR and the communicative approach", ord: 155, code: "47.1", unit: "47 · Applied ELT: online course architecture", unitOrder: 47, level: "C2" },
  { slug: "asynchronous-comprehension-activities", title: "Asynchronous comprehension and language activities", ord: 156, code: "47.2", unit: "47 · Applied ELT: online course architecture", unitOrder: 47, level: "C2" },
  { slug: "asynchronous-speaking-writing-solutions", title: "Speaking and writing in an asynchronous course", ord: 157, code: "47.3", unit: "47 · Applied ELT: online course architecture", unitOrder: 47, level: "C2" },
  { slug: "flipped-efl-blended-models", title: "Flipped EFL and blended models", ord: 158, code: "47.4", unit: "47 · Applied ELT: online course architecture", unitOrder: 47, level: "C2" },
  { slug: "moodle-canvas-language-configuration", title: "Moodle and Canvas configuration for language courses", ord: 159, code: "47.5", unit: "47 · Applied ELT: online course architecture", unitOrder: 47, level: "C2" },
  { slug: "language-progress-tracking-retention", title: "Tracking language progress and retention", ord: 160, code: "47.6", unit: "47 · Applied ELT: online course architecture", unitOrder: 47, level: "C2" },
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
      focus: topic.focus ?? "healthtech, emprendimiento y Silicon Valley",
    });
    console.log(`ok ${topic.code ?? topic.ord} · ${topic.unit} · ${topic.slug}`);
  }
}

void main();
