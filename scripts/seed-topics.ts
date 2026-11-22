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
  // ── Módulos 18-30: B1 y B2 (owner) ──
  { slug: "past-simple-vs-present-perfect", title: "Pasado simple vs. presente perfecto: evento cerrado frente a experiencia o periodo abierto, y marcadores incompatibles", ord: 43, code: "18.1", unit: "18 · Pasado: contraste y narración", unitOrder: 18, level: "B1" },
  { slug: "past-perfect-simple", title: "Pasado perfecto simple (had + participio) en secuencias narrativas con before, after, by the time y already", ord: 44, code: "18.2", unit: "18 · Pasado: contraste y narración", unitOrder: 18, level: "B1" },
  { slug: "used-to-vs-would", title: "Used to y would para hábitos pasados, y por qué would no sirve para estados permanentes", ord: 45, code: "18.3", unit: "18 · Pasado: contraste y narración", unitOrder: 18, level: "B1" },
  { slug: "second-conditional", title: "Segundo condicional (If + pasado simple, would/could/might): consejos con If I were you y escenarios imaginarios", ord: 46, code: "19.1", unit: "19 · Hipótesis, pasiva y estilo indirecto", unitOrder: 19, level: "B1" },
  { slug: "passive-voice-basic", title: "Voz pasiva básica en presente y pasado simple: am/is/are y was/were + participio, con by solo cuando aporta", ord: 47, code: "19.2", unit: "19 · Hipótesis, pasiva y estilo indirecto", unitOrder: 19, level: "B1" },
  { slug: "reported-speech-basic", title: "Estilo indirecto básico: backshift con say/tell, preguntas con if/whether y órdenes con ask/tell + to", ord: 48, code: "19.3", unit: "19 · Hipótesis, pasiva y estilo indirecto", unitOrder: 19, level: "B1" },
  { slug: "defining-relative-clauses", title: "Oraciones de relativo especificativas con who, which, that, where y whose; omisión del relativo como objeto", ord: 49, code: "20.1", unit: "20 · Relativos, modales y conectores", unitOrder: 20, level: "B1" },
  { slug: "modals-deduction-present", title: "Modales de deducción en presente: must be, might/could be y can't be para justificar hipótesis", ord: 50, code: "20.2", unit: "20 · Relativos, modales y conectores", unitOrder: 20, level: "B1" },
  { slug: "connectors-cause-contrast", title: "Conectores de causa, contraste y consecuencia: although, however, despite / in spite of, therefore y so that", ord: 51, code: "20.3", unit: "20 · Relativos, modales y conectores", unitOrder: 20, level: "B1" },
  { slug: "phrasal-verbs-everyday", title: "Phrasal verbs separables e inseparables: turn off the light / turn it off frente a look after y get on with", ord: 52, code: "21.1", unit: "21 · Phrasal verbs cotidianos", unitOrder: 21, level: "B1" },
  { slug: "education-learning", title: "Educación y aprendizaje: asignaturas, exámenes, calificaciones y técnicas de estudio (revise, pass/fail, assignment, degree)", ord: 53, code: "22.1", unit: "22 · Vocabulario B1: educación, trabajo y vida", unitOrder: 22, level: "B1" },
  { slug: "work-employment", title: "Trabajo y empleo: búsqueda laboral, entrevistas, salario, turnos y puestos (apply, resume, shift, full-time, promotion)", ord: 54, code: "22.2", unit: "22 · Vocabulario B1: educación, trabajo y vida", unitOrder: 22, level: "B1" },
  { slug: "relationships-life-stages", title: "Relaciones y etapas de la vida: vínculos, acuerdos y desacuerdos, desde la infancia hasta la jubilación", ord: 55, code: "22.3", unit: "22 · Vocabulario B1: educación, trabajo y vida", unitOrder: 22, level: "B1" },
  { slug: "media-film-literature", title: "Medios, cine y literatura: géneros, reseñas, titulares y consumo de información", ord: 56, code: "23.1", unit: "23 · Vocabulario B1: medios, sociedad y léxico", unitOrder: 23, level: "B1" },
  { slug: "environment-society", title: "Medio ambiente y sociedad: sostenibilidad, residuos, contaminación, desigualdad y participación comunitaria", ord: 57, code: "23.2", unit: "23 · Vocabulario B1: medios, sociedad y léxico", unitOrder: 23, level: "B1" },
  { slug: "word-formation", title: "Formación de palabras: prefijos y sufijos (un-, dis-, im-, -ment, -tion, -ful, -less) para deducir significados", ord: 58, code: "23.3", unit: "23 · Vocabulario B1: medios, sociedad y léxico", unitOrder: 23, level: "B1" },
  { slug: "tenses-passive-advanced", title: "Tiempos verbales completos y su traspaso a pasiva; futuro continuo y futuro perfecto para proyecciones y plazos", ord: 59, code: "24.1", unit: "24 · Tiempos y pasiva avanzada", unitOrder: 24, level: "B2" },
  { slug: "perfect-continuous", title: "Tiempos perfectos continuos: have/has been + -ing y had been + -ing para duración acumulada", ord: 60, code: "24.2", unit: "24 · Tiempos y pasiva avanzada", unitOrder: 24, level: "B2" },
  { slug: "third-mixed-conditionals", title: "Tercer condicional y condicionales mixtos: causa pasada con resultado presente y viceversa", ord: 61, code: "25.1", unit: "25 · Condicionales y deseos", unitOrder: 25, level: "B2" },
  { slug: "wish-if-only", title: "I wish / If only con pasado simple, con would y con pasado perfecto: deseos, quejas y arrepentimientos", ord: 62, code: "25.2", unit: "25 · Condicionales y deseos", unitOrder: 25, level: "B2" },
  { slug: "perfect-modals", title: "Modales perfectos: must have, might/may/could have, can't/couldn't have y should have para crítica retrospectiva", ord: 63, code: "26.1", unit: "26 · Modales perfectos y causativa", unitOrder: 26, level: "B2" },
  { slug: "causative-have-get", title: "Estructura causativa have/get something done frente a la voz pasiva, con el uso informal de get", ord: 64, code: "26.2", unit: "26 · Modales perfectos y causativa", unitOrder: 26, level: "B2" },
  { slug: "non-defining-relative-clauses", title: "Oraciones de relativo explicativas: información no restrictiva con comas, sin that y con which para toda la cláusula", ord: 65, code: "27.1", unit: "27 · Relativos y estilo indirecto avanzado", unitOrder: 27, level: "B2" },
  { slug: "reported-speech-advanced", title: "Estilo indirecto avanzado: deny, admit, suggest, warn, apologize for, accuse of e insist on con gerundio, infinitivo o that", ord: 66, code: "27.2", unit: "27 · Relativos y estilo indirecto avanzado", unitOrder: 27, level: "B2" },
  { slug: "gerund-infinitive-meaning-change", title: "Verbos que cambian de sentido: remember/stop/forget/try/regret con -ing frente a to + infinitivo", ord: 67, code: "28.1", unit: "28 · Gerundio e infinitivo con cambio de significado", unitOrder: 28, level: "B2" },
  { slug: "economy-finance-business", title: "Economía, finanzas y negocios: presupuesto, inversión, inflación, oferta y demanda, léxico corporativo", ord: 68, code: "29.1", unit: "29 · Vocabulario B2: economía, ciencia y justicia", unitOrder: 29, level: "B2" },
  { slug: "science-technology-ai", title: "Ciencia, tecnología e IA: investigación, automatización, algoritmos, ética digital, datos", ord: 69, code: "29.2", unit: "29 · Vocabulario B2: economía, ciencia y justicia", unitOrder: 29, level: "B2" },
  { slug: "crime-justice-rights", title: "Crimen, justicia y derechos: delitos, garantías procesales, tribunales, sanciones y derechos civiles", ord: 70, code: "29.3", unit: "29 · Vocabulario B2: economía, ciencia y justicia", unitOrder: 29, level: "B2" },
  { slug: "art-culture-aesthetics", title: "Arte, cultura y estética: corrientes artísticas, análisis crítico e interpretación simbólica", ord: 71, code: "30.1", unit: "30 · Vocabulario B2: arte, colocaciones y modismos", unitOrder: 30, level: "B2" },
  { slug: "collocations", title: "Colocaciones léxicas: make a decision, take responsibility, heavy rain, pose a threat", ord: 72, code: "30.2", unit: "30 · Vocabulario B2: arte, colocaciones y modismos", unitOrder: 30, level: "B2" },
  { slug: "idioms-register", title: "Modismos de uso frecuente y ajuste de registro: académico, profesional y coloquial", ord: 73, code: "30.3", unit: "30 · Vocabulario B2: arte, colocaciones y modismos", unitOrder: 30, level: "B2" },
  // ── Módulos 31-39: C1, C2 y Business English ──
  { slug: "negative-inversion", title: "Inversión negativa y enfática: Never have I..., Not only did he..., Seldom do we... con never, seldom, rarely, hardly, under no circumstances", ord: 74, code: "31.1", unit: "31 · Énfasis e inversión (C1)", unitOrder: 31, level: "C1" },
  { slug: "cleft-sentences", title: "Oraciones hendidas: What I need is..., It was John who... para focalizar sujeto, objeto o circunstancia con efecto contrastivo", ord: 75, code: "31.2", unit: "31 · Énfasis e inversión (C1)", unitOrder: 31, level: "C1" },
  { slug: "conditional-inversion", title: "Inversión en condicionales formales: Had I known..., Were you to..., Should you need... sin if", ord: 76, code: "31.3", unit: "31 · Énfasis e inversión (C1)", unitOrder: 31, level: "C1" },
  { slug: "ellipsis-substitution", title: "Elipsis y sustitución: so, neither, one/ones, do so, so/not tras think/hope/suppose y omisión de auxiliares", ord: 77, code: "31.4", unit: "31 · Énfasis e inversión (C1)", unitOrder: 31, level: "C1" },
  { slug: "participle-clauses", title: "Oraciones de participio: -ing, -ed y having + participio para condensar temporales, causales y concesivas, sin participios colgantes", ord: 78, code: "32.1", unit: "32 · Sintaxis condensada (C1)", unitOrder: 32, level: "C1" },
  { slug: "formal-subjunctive", title: "Subjuntivo en inglés formal: It is vital that he be..., I suggest she take... con insist, demand, vital, essential", ord: 79, code: "32.2", unit: "32 · Sintaxis condensada (C1)", unitOrder: 32, level: "C1" },
  { slug: "advanced-modal-nuance", title: "Modales con matices: needn't have done vs. didn't need to, dare, be bound to, be supposed to", ord: 80, code: "32.3", unit: "32 · Sintaxis condensada (C1)", unitOrder: 32, level: "C1" },
  { slug: "impersonal-passive", title: "Pasiva impersonal y distanciamiento académico: It is believed that..., He is thought to be... y hedging", ord: 81, code: "32.4", unit: "32 · Sintaxis condensada (C1)", unitOrder: 32, level: "C1" },
  { slug: "academic-argumentative-lexis", title: "Léxico académico y argumentativo: corroborate, refute, scrutinize, contend, undermine, premise y matización de postura", ord: 82, code: "33.1", unit: "33 · Léxico C1: análisis y matices", unitOrder: 33, level: "C1" },
  { slug: "synonym-connotation", title: "Matices de sinonimia y connotación: glance, glare, stare, peek; stroll, stride, trudge, tiptoe, con registro e intensidad", ord: 83, code: "33.2", unit: "33 · Léxico C1: análisis y matices", unitOrder: 33, level: "C1" },
  { slug: "psychology-emotions", title: "Psicología y emociones complejas: sesgos cognitivos, ambivalence, resilience, empathy, apathy, cognitive dissonance", ord: 84, code: "33.3", unit: "33 · Léxico C1: análisis y matices", unitOrder: 33, level: "C1" },
  { slug: "politics-sociology-ethics", title: "Política internacional, sociología y ética: sovereignty, consensus, accountability, utilitarianism, gobernanza y movimientos sociales", ord: 85, code: "34.1", unit: "34 · Léxico C1: mundo y discurso", unitOrder: 34, level: "C1" },
  { slug: "idiomatic-phrasal-verbs", title: "Phrasal verbs idiomáticos de tres palabras: put up with, get away with, look down on, come up against, live up to y sus equivalentes formales", ord: 86, code: "34.2", unit: "34 · Léxico C1: mundo y discurso", unitOrder: 34, level: "C1" },
  { slug: "binomials-metaphors", title: "Binomios fijos y expresiones metafóricas: pros and cons, trial and error, ups and downs, by and large, give and take", ord: 87, code: "34.3", unit: "34 · Léxico C1: mundo y discurso", unitOrder: 34, level: "C1" },
  { slug: "structural-precision", title: "Consolidación estructural y precisión absoluta: excepciones, concordancia compleja, preposiciones dependientes y fosilizaciones", ord: 88, code: "35.1", unit: "35 · Precisión y estilo (C2)", unitOrder: 35, level: "C2" },
  { slug: "thematization-word-order", title: "Tematización y rematización: fronting, extraposition y estructura de información dada frente a nueva", ord: 89, code: "35.2", unit: "35 · Precisión y estilo (C2)", unitOrder: 35, level: "C2" },
  { slug: "advanced-cohesion", title: "Cohesión textual avanzada: encapsuladores nominales y conectores cultos como albeit, notwithstanding, inasmuch as, thereby, hence, whereby", ord: 90, code: "35.3", unit: "35 · Precisión y estilo (C2)", unitOrder: 35, level: "C2" },
  { slug: "pragmatic-distance", title: "Pragmática verbal: cortesía, ironía y distanciamiento con I was wondering if you might..., Did you want...? y modestia retórica", ord: 91, code: "36.1", unit: "36 · Pragmática y fórmulas (C2)", unitOrder: 36, level: "C2" },
  { slug: "archaic-formulas", title: "Fórmulas arcaicas y literarias: be that as it may, suffice it to say, come what may, far be it from me to..., so be it", ord: 92, code: "36.2", unit: "36 · Pragmática y fórmulas (C2)", unitOrder: 36, level: "C2" },
  { slug: "multidisciplinary-terminology", title: "Terminología especializada multidisciplinar: litigation, prognosis, allegory, epistemology, liquidity en prensa y textos cultos", ord: 93, code: "37.1", unit: "37 · Léxico C2: especializado y cultural", unitOrder: 37, level: "C2" },
  { slug: "cultural-references", title: "Referencias culturales, literarias e históricas: Achilles' heel, Catch-22, Orwellian, Pyrrhic victory en uso cotidiano y periodístico", ord: 94, code: "37.2", unit: "37 · Léxico C2: especializado y cultural", unitOrder: 37, level: "C2" },
  { slug: "dialect-regional-variation", title: "Variación dialectal y regionalismos: diferencias léxicas, ortográficas y pragmáticas entre inglés británico, estadounidense, australiano, canadiense e irlandés", ord: 95, code: "37.3", unit: "37 · Léxico C2: especializado y cultural", unitOrder: 37, level: "C2" },
  { slug: "humour-irony-euphemism", title: "Humor verbal, ironía, sarcasmo y eufemismos: understatement, hipérbole e intención implícita frente al significado literal", ord: 96, code: "38.1", unit: "38 · Léxico C2: humor y retórica", unitOrder: 38, level: "C2" },
  { slug: "rhetorical-figures", title: "Recursos retóricos y lenguaje figurado: paronomasia, aliteración, oxímoron, metonimia, sinécdoque y metáforas extendidas", ord: 97, code: "38.2", unit: "38 · Léxico C2: humor y retórica", unitOrder: 38, level: "C2" },
  { slug: "business-negotiation", title: "Negociación en inglés: anclaje, concesiones, cierre y manejo de desacuerdos en una mesa de term sheet", ord: 98, code: "39.1", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  { slug: "executive-presentations", title: "Presentaciones ejecutivas: apertura, narrativa de datos, manejo de preguntas hostiles y cierre con pedido explícito", ord: 99, code: "39.2", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  { slug: "corporate-writing", title: "Redacción corporativa: emails, memos, propuestas y reportes con tono profesional y estructura escaneable", ord: 100, code: "39.3", unit: "39 · Business English", unitOrder: 39, level: "B2" },
  { slug: "intercultural-communication", title: "Comunicación intercultural: expectativas de directness, jerarquía y feedback entre LatAm, EE. UU. y Europa", ord: 101, code: "39.4", unit: "39 · Business English", unitOrder: 39, level: "B2" },
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
