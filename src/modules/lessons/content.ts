import type { CefrLevel } from "@/shared/types";

/**
 * The lessons that ship with the app.
 *
 * They live here, not inside `prisma/seed.ts`, so the seed can import them and a
 * test can read them: a lesson that drifts out of the canonical structure is
 * caught before it reaches the database. Summaries and levels are unchanged from
 * the original seed; only the body was written into the five sections.
 */
export interface LessonSeed {
  module: string;
  level: CefrLevel;
  title: string;
  summary: string;
  content: string;
  order: number;
}

export const LESSON_SEEDS: readonly LessonSeed[] = [
  {
    module: "vocabulary",
    level: "A1",
    title: "Vocabulario básico de salud",
    summary: "Palabras esenciales para hablar de salud.",
    order: 1,
    content: [
      "Goal: Describe a patient and a clinic visit with eight everyday words.",
      "Learn: patient, doctor, hospital, medicine, health, sick, well.",
      'Examples: "The patient is sick." / "The doctor works in a hospital."',
      "Practice: Write three sentences about your own week using sick, well and medicine.",
      'Common mistake: "El paciente está mal" is not "the patient is bad". Use "sick" or "unwell", and keep "bad" for quality.',
    ].join("\n\n"),
  },
  {
    module: "vocabulary",
    level: "B1",
    title: "Vocabulario healtech intermedio",
    summary: "Términos técnicos del sector salud-digital.",
    order: 1,
    content: [
      "Goal: Explain how your product handles patient data without switching to Spanish.",
      "Learn: telemedicine, EHR, HIPAA, interoperability, patient data, compliance.",
      'Examples: "Our EHR sends patient data to the lab." / "HIPAA compliance is a blocker for the pilot."',
      "Practice: Explain your product to a doctor in three sentences using telemedicine, EHR and compliance.",
      'Common mistake: HIPAA is a US law, not a certificate. Say "HIPAA compliant", never "HIPAA certified".',
    ].join("\n\n"),
  },
  {
    module: "vocabulary",
    level: "C1",
    title: "Vocabulario avanzado healtech",
    summary: "Términos regulatorios y de datos.",
    order: 1,
    content: [
      "Goal: Read a regulatory brief and say what evidence it demands.",
      "Learn: FHIR, pharmacovigilance, real-world evidence, clinical trial, FDA approval, CE mark.",
      'Examples: "FHIR is the data standard the payer asked for." / "Real-world evidence is cheaper to produce than a new trial."',
      "Practice: Summarise one regulatory paragraph in three sentences, one term per sentence.",
      'Common mistake: a drug needs "FDA approval" in the US and a "CE mark" in the EU; neither is a "certificate".',
    ].join("\n\n"),
  },
  {
    module: "business-english",
    level: "B1",
    title: "Emails profesionales",
    summary: "Estructura de emails de negocio.",
    order: 1,
    content: [
      "Goal: Write a short email that gets a reply.",
      "Learn: subject line, greeting, body, call to action, sign-off.",
      'Examples: "Hi team, please find attached the Q3 report." / "Could you confirm by Friday? Best, Mauro."',
      "Practice: Rewrite your last email so the ask is one sentence inside the first two lines.",
      'Common mistake: "I write you to ask" is not English. Use "I am writing to ask", or drop it and start with the ask.',
    ].join("\n\n"),
  },
  {
    module: "business-english",
    level: "B2",
    title: "Reuniones y pitches",
    summary: "Vocabulario para reuniones y presentaciones.",
    order: 1,
    content: [
      "Goal: Give a 30-second update with one number per sentence.",
      "Learn: agenda, milestone, runway, burn rate, traction, KPI, pivot.",
      'Examples: "We have twelve months of runway at the current burn rate." / "Traction is the only KPI investors read twice."',
      "Practice: Record your pitch and cut every sentence that has no number or no decision in it.",
      'Common mistake: "pivot" is not "pivotar" as in pivoting a page. It means changing product direction after learning something.',
    ].join("\n\n"),
  },
  {
    module: "contracts",
    level: "B1",
    title: "Contratos básicos",
    summary: "Vocabulario legal esencial.",
    order: 1,
    content: [
      "Goal: Read the first page of a contract and say what you are signing.",
      "Learn: NDA, liability, term, clause.",
      'Examples: "Sign the NDA before we open the data room." / "The term is two years, renewable."',
      "Practice: Take one clause you signed this year and explain it in one sentence.",
      'Common mistake: "term" in a contract is its duration, not vocabulary. "Liability" is legal responsibility, not a bill you owe today.',
    ].join("\n\n"),
  },
  {
    module: "contracts",
    level: "C1",
    title: "Cláusulas avanzadas",
    summary: "Indemnification, IP, exclusivity.",
    order: 1,
    content: [
      "Goal: Spot the three clauses that change who carries the risk in a deal.",
      "Learn: indemnification, IP assignment, exclusivity.",
      'Examples: "Indemnification covers third-party claims." / "IP assignment happens at signature, not at payment."',
      "Practice: Tell a founder why exclusivity is not the same as a lock-in, in two sentences.",
      'Common mistake: "indemnification" is not insurance. It is the contractual promise to compensate the other side.',
    ].join("\n\n"),
  },
  {
    module: "reading",
    level: "B1",
    title: "Leer documentación técnica",
    summary: "Estrategias de lectura.",
    order: 1,
    content: [
      "Goal: Get the three facts you need out of a technical page in five minutes.",
      "Learn: skim for the main idea, scan for details, note unknown terms.",
      'Examples: "Skim the README first." / "Then scan for the endpoint you need."',
      "Practice: Open one API page and write its three key facts without translating them.",
      "Common mistake: reading line by line in English from the first paragraph. Read the headings, then the details.",
    ].join("\n\n"),
  },
  {
    module: "listening",
    level: "B1",
    title: "Escuchar reuniones",
    summary: "Tips para listening en reuniones.",
    order: 1,
    content: [
      "Goal: Follow a call and leave with the actions and the numbers.",
      "Learn: key verbs, numbers, note-taking.",
      'Examples: "Let\'s circle back on pricing." / "The action item is on me."',
      "Practice: Listen to five minutes of a recorded call and write every number you hear.",
      'Common mistake: "circle back" does not mean going around in a circle. It means talking again later.',
    ].join("\n\n"),
  },
  {
    module: "grammar",
    level: "B1",
    title: "Tiempos verbales profesionales",
    summary: "Present perfect, passive voice.",
    order: 1,
    content: [
      "Goal: Report status without saying when it happened, because the result is what matters.",
      "Learn: present perfect, passive voice.",
      'Examples: "We have launched the app." / "The report was approved on Friday."',
      "Practice: Turn three updates from your week into present perfect sentences.",
      'Common mistake: "We have launched it yesterday" mixes two times. Present perfect never takes a finished past moment; use the past simple.',
    ].join("\n\n"),
  },
];
