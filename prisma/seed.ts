import { PrismaClient, CefrLevel, Skill, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

async function main() {
  // Modules
  const modules = [
    { slug: "vocabulary", name: "Vocabulario healtech", description: "Términos médicos, regulatorios y tecnológicos.", icon: "🩺", order: 1 },
    { slug: "reading", name: "Reading", description: "Artículos y documentación técnica.", icon: "📖", order: 2 },
    { slug: "listening", name: "Listening", description: "Audios y transcripciones de reuniones.", icon: "🎧", order: 3 },
    { slug: "business-english", name: "Business English", description: "Emails, reuniones, pitches y negociación.", icon: "💼", order: 4 },
    { slug: "contracts", name: "Contratos", description: "Vocabulario legal y cláusulas comunes.", icon: "📜", order: 5 },
    { slug: "grammar", name: "Gramática", description: "Estructuras para comunicación profesional.", icon: "✏️", order: 6 },
  ];
  for (const m of modules) {
    await prisma.module.upsert({ where: { slug: m.slug }, update: m, create: m });
  }

  // Questions: build a bank
  const qBank: {
    level: CefrLevel;
    skill: Skill;
    type: QuestionType;
    prompt: string;
    options: string[];
    answer: string;
    explanation?: string;
    tags: string[];
  }[] = [];

  const add = (level: CefrLevel, skill: Skill, prompt: string, options: string[], answer: string, tags: string[] = []) => {
    qBank.push({ level, skill, type: "MULTIPLE_CHOICE", prompt, options, answer, tags });
  };

  // VOCABULARY
  add("A1", "VOCABULARY", "What is a 'patient'?", ["A doctor", "A person receiving care", "A medicine", "A hospital"], "A person receiving care", ["health"]);
  add("A1", "VOCABULARY", "What does 'app' mean?", ["A mobile application", "A doctor", "A pill", "A clinic"], "A mobile application", ["tech"]);
  add("A2", "VOCABULARY", "What is 'telemedicine'?", ["Medicine by phone/online", "A pill", "A surgery", "A nurse"], "Medicine by phone/online", ["health", "tech"]);
  add("A2", "VOCABULARY", "What does 'startup' mean?", ["A new company", "A medicine", "A hospital", "A patient"], "A new company", ["business"]);
  add("B1", "VOCABULARY", "What is 'HIPAA'?", ["US health privacy law", "A medicine", "A device", "A doctor"], "US health privacy law", ["legal", "health"]);
  add("B1", "VOCABULARY", "What does 'scalable' mean?", ["Can grow without losing quality", "Cheap", "Small", "Broken"], "Can grow without losing quality", ["tech", "business"]);
  add("B2", "VOCABULARY", "What is 'interoperability' in health IT?", ["Systems exchanging data", "A drug", "A surgery", "A nurse"], "Systems exchanging data", ["tech", "health"]);
  add("B2", "VOCABULARY", "What does 'burn rate' mean?", ["Speed of spending cash", "Revenue", "Profit", "Salary"], "Speed of spending cash", ["business", "finance"]);
  add("C1", "VOCABULARY", "What is 'fhir'?", ["Health data exchange standard", "A drug", "A device", "A law"], "Health data exchange standard", ["tech", "health"]);
  add("C1", "VOCABULARY", "What does 'due diligence' mean?", ["Investigation before a deal", "A payment", "A contract", "A meeting"], "Investigation before a deal", ["business", "legal"]);
  add("C2", "VOCABULARY", "What is 'pharmacovigilance'?", ["Drug safety monitoring", "A surgery", "A clinic", "A pill"], "Drug safety monitoring", ["health", "regulatory"]);

  // GRAMMAR
  add("A1", "GRAMMAR", "Choose the correct: 'She ___ a doctor.'", ["is", "are", "am", "be"], "is", ["grammar"]);
  add("A2", "GRAMMAR", "Choose: 'We have ___ patients today.'", ["many", "much", "a lot", "few"], "many", ["grammar"]);
  add("B1", "GRAMMAR", "Choose: 'The report ___ finished yesterday.'", ["was", "were", "is", "has"], "was", ["grammar", "passive"]);
  add("B2", "GRAMMAR", "Choose: 'If we had invested earlier, we ___ more market share.'", ["would have", "will have", "had", "have"], "would have", ["grammar", "conditional"]);
  add("C1", "GRAMMAR", "Choose: 'The contract, ___ was signed last week, takes effect today.'", ["which", "who", "whom", "whose"], "which", ["grammar", "relative"]);
  add("C2", "GRAMMAR", "Choose: 'Had the audit been completed, the deal ___.'", ["would have closed", "will close", "closes", "closed"], "would have closed", ["grammar", "inversion"]);

  // READING
  add("B1", "READING", "A short article says: 'Telehealth reduces hospital visits.' What is the main idea?", ["Telehealth increases visits", "Telehealth reduces visits", "Hospitals close", "Doctors retire"], "Telehealth reduces visits", ["reading"]);
  add("B2", "READING", "Text: 'The startup secured Series A funding.' What happened?", ["Lost money", "Raised investment", "Closed", "Hired staff"], "Raised investment", ["reading", "business"]);
  add("C1", "READING", "Passage: 'Regulatory compliance is a barrier to entry.' Implication?", ["Easy to enter market", "Hard to enter market", "No regulations", "Free market"], "Hard to enter market", ["reading", "regulatory"]);

  // LISTENING
  add("B1", "LISTENING", "In a meeting audio, the CEO says 'Let's pivot.' What does she want?", ["Continue same plan", "Change direction", "Hire more", "Close company"], "Change direction", ["listening", "business"]);
  add("B2", "LISTENING", "Audio: 'We need to ship by Q3.' Deadline?", ["Q1", "Q2", "Q3", "Q4"], "Q3", ["listening", "business"]);

  // BUSINESS
  add("B1", "BUSINESS", "What is a 'pitch deck'?", ["A slide presentation to investors", "A contract", "A medicine", "A report"], "A slide presentation to investors", ["business"]);
  add("B2", "BUSINESS", "What does 'runway' mean for a startup?", ["Time until cash runs out", "Office space", "Product", "Team size"], "Time until cash runs out", ["business", "finance"]);
  add("C1", "BUSINESS", "What is 'term sheet'?", ["Non-binding investment agreement", "Final contract", "Invoice", "Receipt"], "Non-binding investment agreement", ["business", "legal"]);

  // CONTRACTS
  add("B1", "CONTRACTS", "What is an 'NDA'?", ["Non-disclosure agreement", "New drug application", "Network data access", "No deal allowed"], "Non-disclosure agreement", ["legal"]);
  add("B2", "CONTRACTS", "What does 'liability' mean?", ["Legal responsibility", "Profit", "Revenue", "Salary"], "Legal responsibility", ["legal"]);
  add("C1", "CONTRACTS", "What is 'indemnification'?", ["Compensation for loss/damage", "A payment", "A tax", "A salary"], "Compensation for loss/damage", ["legal"]);

  // Fill more questions to have enough per level/skill by duplicating with variants for A1/A2 lower
  // Add simple A1/A2 grammar/vocab more
  add("A1", "GRAMMAR", "Choose: 'I ___ from Argentina.'", ["am", "is", "are", "be"], "am", ["grammar"]);
  add("A1", "VOCABULARY", "What is 'health'?", ["State of well-being", "A doctor", "A pill", "A hospital"], "State of well-being", ["health"]);
  add("A2", "GRAMMAR", "Choose: 'They ___ working now.'", ["are", "is", "am", "be"], "are", ["grammar", "progressive"]);
  add("A2", "VOCABULARY", "What is 'data'?", ["Information", "A drug", "A doctor", "A clinic"], "Information", ["tech"]);
  add("B1", "GRAMMAR", "Choose: 'We have been ___ for 3 years.'", ["working", "work", "worked", "works"], "working", ["grammar", "perfect"]);
  add("B2", "GRAMMAR", "Choose: 'The system, ___ updated last night, is faster.'", ["which was", "who was", "whom", "whose"], "which was", ["grammar"]);
  add("C1", "GRAMMAR", "Choose: 'Not only ___ the bug, but also improved performance.'", ["did we fix", "we fixed", "fixed we", "we did fix"], "did we fix", ["grammar", "inversion"]);
  add("C2", "VOCABULARY", "What is 'real-world evidence' in pharma?", ["Data from actual patient use", "Lab trial", "Opinion", "Marketing"], "Data from actual patient use", ["health", "regulatory"]);

  // Insert questions
  for (const q of qBank) {
    await prisma.question.create({
      data: {
        level: q.level,
        skill: q.skill,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation ?? null,
        tags: q.tags,
      },
    });
  }

  // Lessons
  const lessons = [
    { module: "vocabulary", level: "A1" as CefrLevel, title: "Vocabulario básico de salud", summary: "Palabras esenciales para hablar de salud.", content: "Learn: patient, doctor, hospital, medicine, health, sick, well.\n\nExample: 'The patient is sick.'\n\nPractice using these words in simple sentences.", order: 1 },
    { module: "vocabulary", level: "B1" as CefrLevel, title: "Vocabulario healtech intermedio", summary: "Términos técnicos del sector salud-digital.", content: "Key terms: telemedicine, EHR, HIPAA, interoperability, patient data, compliance.\n\nHIPAA = US health privacy law.\n\nEHR = Electronic Health Record.", order: 1 },
    { module: "vocabulary", level: "C1" as CefrLevel, title: "Vocabulario avanzado healtech", summary: "Términos regulatorios y de datos.", content: "FHIR, pharmacovigilance, real-world evidence, clinical trial, FDA approval, CE mark.\n\nFHIR = Fast Healthcare Interoperability Resources (data standard).", order: 1 },
    { module: "business-english", level: "B1" as CefrLevel, title: "Emails profesionales", summary: "Estructura de emails de negocio.", content: "Subject line, greeting, body, call to action, sign-off.\n\nExample: 'Hi team, please find attached the Q3 report. Best, Mauro.'", order: 1 },
    { module: "business-english", level: "B2" as CefrLevel, title: "Reuniones y pitches", summary: "Vocabulario para reuniones y presentaciones.", content: "Agenda, milestone, runway, burn rate, traction, KPI, pivot.\n\nPivot = change product direction based on learning.", order: 1 },
    { module: "contracts", level: "B1" as CefrLevel, title: "Contratos básicos", summary: "Vocabulario legal esencial.", content: "NDA = Non-Disclosure Agreement.\nLiability = legal responsibility.\nTerm = duration.\nClause = section of a contract.", order: 1 },
    { module: "contracts", level: "C1" as CefrLevel, title: "Cláusulas avanzadas", summary: "Indemnification, IP, exclusivity.", content: "Indemnification = compensation for loss.\nIP assignment = transferring intellectual property.\nExclusivity = only one party can do X.", order: 1 },
    { module: "reading", level: "B1" as CefrLevel, title: "Leer documentación técnica", summary: "Estrategias de lectura.", content: "Skim for main idea, scan for details, note unknown terms.\n\nPractice with API docs and whitepapers.", order: 1 },
    { module: "listening", level: "B1" as CefrLevel, title: "Escuchar reuniones", summary: "Tips para listening en reuniones.", content: "Focus on key verbs and numbers. Take notes. Ask for clarification.\n\nCommon phrases: 'Let's circle back', 'Action item', 'Takeaway'.", order: 1 },
    { module: "grammar", level: "B1" as CefrLevel, title: "Tiempos verbales profesionales", summary: "Present perfect, passive voice.", content: "Present perfect: 'We have launched the app.'\nPassive: 'The report was approved.'\nUseful for status updates.", order: 1 },
  ];
  for (const l of lessons) {
    await prisma.lesson.create({ data: l });
  }

  // Vocabulary
  const vocab = [
    { term: "patient", definition: "A person receiving medical care.", example: "The patient needs a check-up.", module: "vocabulary", level: "A1" as CefrLevel },
    { term: "telemedicine", definition: "Medical care delivered remotely via technology.", example: "We offer telemedicine consultations.", module: "vocabulary", level: "A2" as CefrLevel },
    { term: "HIPAA", definition: "US law protecting patient health information.", example: "Ensure HIPAA compliance.", module: "vocabulary", level: "B1" as CefrLevel },
    { term: "interoperability", definition: "Ability of systems to exchange data.", example: "FHIR improves interoperability.", module: "vocabulary", level: "B2" as CefrLevel },
    { term: "FHIR", definition: "Standard for health data exchange.", example: "We implemented FHIR APIs.", module: "vocabulary", level: "C1" as CefrLevel },
    { term: "NDA", definition: "Non-Disclosure Agreement.", example: "Sign the NDA before sharing.", module: "contracts", level: "B1" as CefrLevel },
    { term: "liability", definition: "Legal responsibility.", example: "Limit liability in the contract.", module: "contracts", level: "B2" as CefrLevel },
    { term: "indemnification", definition: "Compensation for loss or damage.", example: "Indemnification clause protects both parties.", module: "contracts", level: "C1" as CefrLevel },
    { term: "pitch deck", definition: "Slide presentation to investors.", example: "Prepare the pitch deck for Series A.", module: "business-english", level: "B1" as CefrLevel },
    { term: "runway", definition: "Time until cash runs out.", example: "We have 12 months of runway.", module: "business-english", level: "B2" as CefrLevel },
    { term: "term sheet", definition: "Non-binding investment agreement.", example: "Review the term sheet carefully.", module: "business-english", level: "C1" as CefrLevel },
    { term: "burn rate", definition: "Speed of spending cash.", example: "Reduce burn rate to extend runway.", module: "business-english", level: "B2" as CefrLevel },
    { term: "scalable", definition: "Can grow without losing quality.", example: "Build a scalable architecture.", module: "vocabulary", level: "B1" as CefrLevel },
    { term: "due diligence", definition: "Investigation before a deal.", example: "Investors do due diligence.", module: "business-english", level: "C1" as CefrLevel },
  ];
  for (const v of vocab) {
    await prisma.vocabulary.create({ data: v });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
