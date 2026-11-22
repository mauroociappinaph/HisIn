import type { CefrLevel } from "@/shared/types";

/**
 * Grammar reference as content, not as a generated guess.
 *
 * Rules and contrasts are curriculum, so they are authored once and tested; the
 * engine adds practice and examples on top. Every topic answers the question the
 * learner actually asks: "where is this used?" — `whenToUse` is written in terms
 * of the work they do, not in terms of the grammar book.
 */
export type GrammarAxis = "TIEMPOS" | "ESTRUCTURAS" | "REGLAS";

export interface GrammarExample {
  en: string;
  es: string;
}

export interface GrammarError {
  wrong: string;
  right: string;
  why: string;
}

export interface GrammarTopic {
  slug: string;
  title: string;
  level: CefrLevel;
  axis: GrammarAxis;
  order: number;
  summary: string;
  whenToUse: string[];
  form: string;
  examples: GrammarExample[];
  errors: GrammarError[];
  relatedPatterns: string[];
}

export const AXIS_LABELS: Record<GrammarAxis, string> = {
  TIEMPOS: "Tiempos verbales",
  ESTRUCTURAS: "Estructuras",
  REGLAS: "Reglas clave",
};

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    slug: "present-simple",
    title: "Present simple",
    level: "A1",
    axis: "TIEMPOS",
    order: 1,
    summary: "Hechos, rutinas y verdades generales. Es el tiempo del «cómo funciona esto».",
    whenToUse: [
      "Describir lo que un producto hace: «The app stores the record».",
      "Rutinas y procesos: «We ship every Thursday».",
      "Verdades generales y reglas: «FHIR uses resources».",
    ],
    form: "sujeto + verbo (+ -s en 3.ª persona) · negativo: don't/doesn't + verbo · pregunta: do/does + sujeto",
    examples: [
      { en: "The platform stores every patient record encrypted.", es: "La plataforma guarda cada historia clínica cifrada." },
      { en: "We don't share data with third parties.", es: "No compartimos datos con terceros." },
      { en: "Does the API return the full bundle?", es: "¿La API devuelve el bundle completo?" },
    ],
    errors: [
      {
        wrong: "He don't review the charts.",
        right: "He doesn't review the charts.",
        why: "En tercera persona singular el auxiliar es doesn't, no don't.",
      },
      {
        wrong: "The app store the data.",
        right: "The app stores the data.",
        why: "Se olvida la -s de tercera persona porque en español no cambia el verbo.",
      },
    ],
    relatedPatterns: [],
  },
  {
    slug: "present-continuous",
    title: "Present continuous",
    level: "A2",
    axis: "TIEMPOS",
    order: 2,
    summary: "Lo que está pasando ahora o alrededor de ahora. Útil para estados temporales.",
    whenToUse: [
      "Algo en curso: «We are migrating the database this week».",
      "Cambios y tendencias: «Adoption is growing fast».",
      "Planes ya cerrados y cercanos: «I'm meeting the auditor tomorrow».",
    ],
    form: "sujeto + am/is/are + verbo-ing",
    examples: [
      { en: "The team is testing the new onboarding flow.", es: "El equipo está probando el nuevo flujo de onboarding." },
      { en: "Reimbursement rules are changing in three states.", es: "Las reglas de reembolso están cambiando en tres estados." },
      { en: "I'm not using that tool anymore.", es: "Ya no estoy usando esa herramienta." },
    ],
    errors: [
      {
        wrong: "I am agree with the proposal.",
        right: "I agree with the proposal.",
        why: "«Agree» es verbo, no adjetivo: no lleva be delante.",
      },
      {
        wrong: "We are working here since 2020.",
        right: "We have been working here since 2020.",
        why: "Con since/for se usa el perfecto, no el continuo simple.",
      },
    ],
    relatedPatterns: [],
  },
  {
    slug: "past-simple",
    title: "Past simple",
    level: "A2",
    axis: "TIEMPOS",
    order: 3,
    summary: "Un hecho terminado en un momento terminado. El tiempo del reporte y del post-mortem.",
    whenToUse: [
      "Eventos cerrados: «The FDA rejected the application in March».",
      "Secuencias de acciones: «We launched, we measured, we pivoted».",
      "Con fechas y horas concretas: «We signed the NDA yesterday».",
    ],
    form: "sujeto + verbo en pasado (regular -ed / irregular) · negativo: didn't + verbo · pregunta: did + sujeto",
    examples: [
      { en: "The agency rejected the application in March.", es: "La agencia rechazó la solicitud en marzo." },
      { en: "We didn't see the churn spike until the weekly review.", es: "No vimos el pico de churn hasta la revisión semanal." },
      { en: "Did you send the board deck last night?", es: "¿Mandaste el deck del board anoche?" },
    ],
    errors: [
      {
        wrong: "Did you sent the report?",
        right: "Did you send the report?",
        why: "Con el auxiliar did el verbo vuelve al infinitivo.",
      },
      {
        wrong: "I have seen him yesterday.",
        right: "I saw him yesterday.",
        why: "Con un marcador de tiempo terminado (yesterday) va past simple, no present perfect.",
      },
    ],
    relatedPatterns: [],
  },
  {
    slug: "past-continuous",
    title: "Past continuous",
    level: "B1",
    axis: "TIEMPOS",
    order: 4,
    summary: "El fondo de una escena pasada: lo que estaba en curso cuando algo ocurrió.",
    whenToUse: [
      "Contexto interrumpido: «We were deploying when the alert fired».",
      "Dos acciones simultáneas: «I was writing while she was reviewing».",
      "Explicar qué pasaba alrededor de un incidente.",
    ],
    form: "sujeto + was/were + verbo-ing (+ when + past simple)",
    examples: [
      { en: "We were deploying when the monitoring alert fired.", es: "Estábamos desplegando cuando saltó la alerta de monitoreo." },
      { en: "She was reviewing the contract while the call continued.", es: "Ella estaba revisando el contrato mientras seguía la llamada." },
      { en: "They weren't tracking that metric last quarter.", es: "No estaban midiendo esa métrica el trimestre pasado." },
    ],
    errors: [
      {
        wrong: "When the alert fired, we deployed.",
        right: "When the alert fired, we were deploying.",
        why: "Sin el continuo las dos acciones suenan simultáneas y terminadas; el continuo marca el fondo.",
      },
    ],
    relatedPatterns: [],
  },
  {
    slug: "present-perfect",
    title: "Present perfect",
    level: "B1",
    axis: "TIEMPOS",
    order: 5,
    summary:
      "Conecta el pasado con el ahora: experiencia acumulada, resultado presente o algo que empezó antes y sigue. Es el tiempo que más se confunde con el pasado en español.",
    whenToUse: [
      "Resultado que importa ahora: «We have shipped the fix» (está desplegado).",
      "Experiencia sin fecha: «I have negotiated three term sheets».",
      "Algo que empezó antes y continúa: «We have had this bug since Tuesday».",
      "Novedades: «Funding has slowed» (y por eso la estrategia cambia).",
    ],
    form: "sujeto + have/has + participio pasado · negativo: haven't/hasn't · pregunta: have/has + sujeto",
    examples: [
      { en: "We have shipped the fix, so the incident is closed.", es: "Desplegamos el arreglo, así que el incidente está cerrado." },
      { en: "She has negotiated three term sheets this year.", es: "Ella negoció tres term sheets este año." },
      { en: "Funding has slowed since the last quarter.", es: "El financiamiento se desaceleró desde el último trimestre." },
    ],
    errors: [
      {
        wrong: "I have finished the report yesterday.",
        right: "I finished the report yesterday.",
        why: "Si hay un momento terminado (yesterday, in March), se usa past simple.",
      },
      {
        wrong: "We are working on it since Monday.",
        right: "We have been working on it since Monday.",
        why: "«Since» + acción que continúa pide perfecto (continuo si querés marcar duración).",
      },
      {
        wrong: "I have saw the results.",
        right: "I have seen the results.",
        why: "Después de have/has va participio (seen), no pasado (saw).",
      },
    ],
    relatedPatterns: ["is expected to + verb"],
  },
  {
    slug: "present-perfect-vs-past-simple",
    title: "Present perfect vs. past simple",
    level: "B1",
    axis: "TIEMPOS",
    order: 6,
    summary:
      "La decisión más frecuente en una reunión: ¿el hecho está cerrado o sigue importando? La regla es el marcador de tiempo, no el verbo.",
    whenToUse: [
      "Usá past simple cuando el marcador de tiempo esté cerrado: in March, yesterday, last quarter.",
      "Usá present perfect cuando el cuándo no importe o no exista: already, just, ever, since, so far.",
      "En status updates: «We released 2.1» (cerrado) vs. «We have released 2.1» (y ya está en producción).",
    ],
    form: "marcador terminado → past simple · marcador abierto (already, since, so far, ever) → present perfect",
    examples: [
      { en: "We released 2.1 last Friday.", es: "Publicamos la 2.1 el viernes pasado." },
      { en: "We have already released 2.1.", es: "Ya publicamos la 2.1." },
      { en: "Have you ever presented to a board?", es: "¿Alguna vez presentaste ante un board?" },
      { en: "I presented to the board in June.", es: "Presenté ante el board en junio." },
    ],
    errors: [
      {
        wrong: "We have launched the feature last week.",
        right: "We launched the feature last week.",
        why: "«Last week» cierra el tiempo: el perfecto no acepta marcadores terminados.",
      },
      {
        wrong: "Did you ever work with FHIR?",
        right: "Have you ever worked with FHIR?",
        why: "Con «ever» sobre experiencia de vida se usa el perfecto.",
      },
    ],
    relatedPatterns: [],
  },
  {
    slug: "past-perfect",
    title: "Past perfect",
    level: "B2",
    axis: "TIEMPOS",
    order: 7,
    summary: "El pasado del pasado: aclara qué ocurrió antes de otro hecho pasado.",
    whenToUse: [
      "Causa anterior: «The FDA had rejected it before we raised».",
      "En reportes: separar lo que ya estaba hecho de lo que se hizo después.",
      "Con already/never en contexto pasado: «They had never run a trial».",
    ],
    form: "sujeto + had + participio pasado",
    examples: [
      { en: "The FDA had rejected the therapy before the round closed.", es: "La FDA había rechazado la terapia antes de que cerrara la ronda." },
      { en: "We had never run a multi-site trial before.", es: "Nunca habíamos corrido un ensayo multi-sitio antes." },
      { en: "By the time the audit started, we had already fixed the logs.", es: "Cuando empezó la auditoría, ya habíamos arreglado los logs." },
    ],
    errors: [
      {
        wrong: "When we arrived, the meeting already finished.",
        right: "When we arrived, the meeting had already finished.",
        why: "Sin had, el orden temporal queda ambiguo: se lee como simultáneo.",
      },
    ],
    relatedPatterns: ["said + that + had + past participle"],
  },
  {
    slug: "future-forms",
    title: "Futuro: will vs. going to",
    level: "B1",
    axis: "TIEMPOS",
    order: 8,
    summary: "Will para decisiones y promesas del momento; going to para planes ya decididos y predicciones con evidencia.",
    whenToUse: [
      "Will: decisión espontánea, oferta, promesa: «I'll send it today».",
      "Going to: plan ya tomado: «We're going to hire two nurses».",
      "Going to: predicción con evidencia visible: «Churn is going to rise».",
    ],
    form: "will + infinitivo · am/is/are going to + infinitivo · presente continuo para citas agendadas",
    examples: [
      { en: "I'll send the corrected deck after this call.", es: "Te mando el deck corregido después de esta llamada." },
      { en: "We're going to hire two clinical leads next quarter.", es: "Vamos a contratar dos leads clínicos el próximo trimestre." },
      { en: "With this churn curve, we're going to miss the target.", es: "Con esta curva de churn, vamos a fallar el objetivo." },
    ],
    errors: [
      {
        wrong: "I will call you yesterday.",
        right: "I called you yesterday.",
        why: "Will no acepta tiempo pasado: el marcador manda.",
      },
      {
        wrong: "We will hire — it's already approved.",
        right: "We're going to hire — it's already approved.",
        why: "Si ya está decidido, going to (o presente continuo) suena a plan, no a intención.",
      },
    ],
    relatedPatterns: ["is expected to + verb"],
  },
  {
    slug: "conditionals",
    title: "Condicionales (0, 1, 2, 3)",
    level: "B2",
    axis: "ESTRUCTURAS",
    order: 9,
    summary: "Escenarios: lo que siempre pasa, lo que pasará si se cumple una condición, lo hipotético y lo que ya no se puede cambiar.",
    whenToUse: [
      "Tipo 1, condición real: «If the audit passes, we launch in May».",
      "Tipo 2, hipotético presente: «If we had more runway, we would hire».",
      "Tipo 3, pasado irrecuperable: «If we had validated earlier, we wouldn't have lost the pilot».",
      "Hedging en negociación: «If we were to extend the term, would that work?».",
    ],
    form: "0: if + presente, presente · 1: if + presente, will · 2: if + pasado, would · 3: if + had + participio, would have + participio",
    examples: [
      { en: "If the audit passes, we launch in May.", es: "Si la auditoría pasa, lanzamos en mayo." },
      { en: "If we had more runway, we would hire a second engineer.", es: "Si tuviéramos más runway, contrataríamos a un segundo ingeniero." },
      { en: "If we had validated earlier, we wouldn't have lost the pilot.", es: "Si hubiéramos validado antes, no habríamos perdido el piloto." },
      { en: "If we were to extend the term, would that work for you?", es: "Si extendiéramos el plazo, ¿te serviría?" },
    ],
    errors: [
      {
        wrong: "If I would have known, I would have called.",
        right: "If I had known, I would have called.",
        why: "En la cláusula con if nunca va would: va had + participio.",
      },
      {
        wrong: "If we will pass the audit, we launch.",
        right: "If we pass the audit, we launch.",
        why: "Después de if no se usa will para el futuro.",
      },
    ],
    relatedPatterns: ["were to + verb"],
  },
  {
    slug: "passive-voice",
    title: "Voz pasiva",
    level: "B2",
    axis: "ESTRUCTURAS",
    order: 10,
    summary: "Cuando importa lo que pasó o quién lo padece, no quién lo hizo. Es el modo por defecto del reporte regulatorio.",
    whenToUse: [
      "El agente es obvio o desconocido: «The logs were deleted».",
      "Informes y auditorías: «The device was cleared in 2024».",
      "Para no acusar: «A mistake was made in the dosing sheet».",
    ],
    form: "sujeto + be (en el tiempo necesario) + participio pasado (+ by + agente)",
    examples: [
      { en: "The logs were deleted before the audit.", es: "Los logs fueron borrados antes de la auditoría." },
      { en: "The device was cleared by the FDA in 2024.", es: "El dispositivo fue aprobado por la FDA en 2024." },
      { en: "The contract is being reviewed by legal.", es: "Legal está revisando el contrato." },
    ],
    errors: [
      {
        wrong: "The report was write by the team.",
        right: "The report was written by the team.",
        why: "La pasiva pide participio, no infinitivo.",
      },
      {
        wrong: "It was happened last week.",
        right: "It happened last week.",
        why: "Los verbos intransitivos no tienen pasiva en inglés.",
      },
    ],
    relatedPatterns: ["is expected to + verb"],
  },
  {
    slug: "reported-speech",
    title: "Reported speech",
    level: "C1",
    axis: "ESTRUCTURAS",
    order: 11,
    summary: "Contar lo que otro dijo, en reuniones y minutas. El tiempo retrocede un paso y los pronombres se mueven.",
    whenToUse: [
      "Minutas: «She said the audit had passed».",
      "Atribuir sin comprometerte: «They claimed the data was anonymised».",
      "Negociación: «They told us they would send the redline».",
    ],
    form: "verbo introductorio + (that) + cláusula con el tiempo desplazado un paso atrás",
    examples: [
      { en: "She said the audit had passed.", es: "Ella dijo que la auditoría había pasado." },
      { en: "They told us they would send the redline by Friday.", es: "Nos dijeron que mandarían el redline para el viernes." },
      { en: "He asked whether we had validated the endpoint.", es: "Preguntó si habíamos validado el endpoint." },
    ],
    errors: [
      {
        wrong: "She said me that the audit passed.",
        right: "She told me that the audit had passed.",
        why: "«Say» no lleva objeto indirecto con to/me igual que tell: say something / tell someone.",
      },
      {
        wrong: "He asked me where was the report.",
        right: "He asked me where the report was.",
        why: "En la interrogativa indirecta no se invierte el orden.",
      },
    ],
    relatedPatterns: ["said + that + had + past participle"],
  },
];

export function findTopic(slug: string): GrammarTopic | null {
  return GRAMMAR_TOPICS.find((topic) => topic.slug === slug) ?? null;
}

export function topicsByAxis(axis: GrammarAxis): GrammarTopic[] {
  return GRAMMAR_TOPICS.filter((topic) => topic.axis === axis).sort((a, b) => a.order - b.order);
}

/** Progression: the map shows levels in order, never locked. */
export function topicsByLevel(): { level: CefrLevel; topics: GrammarTopic[] }[] {
  const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return levels
    .map((level) => ({
      level,
      topics: GRAMMAR_TOPICS.filter((topic) => topic.level === level).sort((a, b) => a.order - b.order),
    }))
    .filter((group) => group.topics.length > 0);
}
