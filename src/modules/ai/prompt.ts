import { CONTENT_MODULES, type GenerationRequest } from "./schema";

const DOMAIN =
  "HisIn is an English-learning app for entrepreneurs and healthtech founders. Learners are Spanish speakers at CEFR B1 or above, working on healthtech, business, finance and contract English.";

export const SYSTEM_PROMPT = [
  DOMAIN,
  "Write all generated content in English.",
  "Return ONLY a JSON object. No prose, no markdown fences, no comments.",
].join(" ");

function topicRule(request: GenerationRequest): string {
  return request.topic ? ` Focus on: ${JSON.stringify(request.topic)}.` : "";
}

function questionPrompt(request: GenerationRequest): string {
  const typeRule =
    request.type === "FILL_BLANK"
      ? 'For FILL_BLANK set "options" to an empty array and make "answer" the exact missing word or phrase.'
      : `For ${request.type} return between two and four "options" and make "answer" exactly equal to one of them.`;

  return [
    `Generate ${request.count} English-learning questions.`,
    `CEFR level: ${request.level}. Skill: ${request.skill}. Type: ${request.type}.${topicRule(request)}`,
    typeRule,
    'Return this shape: {"questions":[{"level","skill","type","prompt","options","answer","explanation","tags"}]}.',
    `Every question must use level "${request.level}", skill "${request.skill}" and type "${request.type}".`,
    "Add a one-sentence English explanation for the answer and up to four short lowercase tags.",
  ].join(" ");
}

function vocabularyPrompt(request: GenerationRequest): string {
  return [
    `Generate ${request.count} vocabulary entries for English learners.`,
    `CEFR level: ${request.level}.${topicRule(request)}`,
    'Return this shape: {"vocabulary":[{"term","definition","example","module","level"}]}.',
    `Every entry must use level "${request.level}" and module "vocabulary".`,
    `Allowed modules are: ${CONTENT_MODULES.join(", ")}.`,
    "Definition and example are single English sentences that a professional would actually read.",
  ].join(" ");
}

function storyPrompt(request: GenerationRequest): string {
  return [
    `Write ${request.count} short English stories for learners.`,
    `CEFR level: ${request.level}.${topicRule(request)}`,
    'Return this shape: {"stories":[{"module","level","title","body","translation","targetWords"}]}.',
    `Every story must use level "${request.level}" and set "module" to one of: ${CONTENT_MODULES.join(", ")}.`,
    "body: 120 to 200 words of connected narrative that shows the target vocabulary in at least two different situations.",
    "translation: one or two sentences in Spanish summarising the story, so the learner can check comprehension.",
    "targetWords: 3 to 8 words or phrases copied exactly as they appear in the body; the words the learner should notice.",
    "Use real people in concrete situations, not definitions or lists.",
  ].join(" ");
}

function lessonPrompt(request: GenerationRequest): string {
  return [
    `Generate ${request.count} short English lessons.`,
    `CEFR level: ${request.level}.${topicRule(request)}`,
    'Return this shape: {"lessons":[{"module","level","title","summary","content","order"}]}.',
    `Every lesson must use level "${request.level}" and set "order" to 1.`,
    `The module must be one of: ${CONTENT_MODULES.join(", ")}.`,
    "Content is 4 to 8 short lines of practical English with examples, separated by newlines.",
  ].join(" ");
}

/**
 * Builds the user prompt for one generation request.
 *
 * The teaching context travels with every kind: generated items for a
 * postgraduate health cohort must not read like generic B1 filler.
 */
export function buildPrompt(request: GenerationRequest): string {
  const base = buildBasePrompt(request);
  return request.context ? `${base} ${request.context}` : base;
}

function buildBasePrompt(request: GenerationRequest): string {
  switch (request.kind) {
    case "vocabulary":
      return vocabularyPrompt(request);
    case "lesson":
      return lessonPrompt(request);
    case "story":
      return storyPrompt(request);
    default:
      return questionPrompt(request);
  }
}
