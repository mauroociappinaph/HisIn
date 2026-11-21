import type { QuestionRequest } from "./schema";

export function buildSystemPrompt(): string {
  return [
    "You generate English-learning content for HisIn, an app for entrepreneurs and healthtech founders.",
    "Learners are Spanish speakers working at CEFR B1 or above on healthtech, business and contract English.",
    "Write every question and every option in English.",
    "Return ONLY a JSON object. No prose, no markdown fences, no comments.",
  ].join(" ");
}

/** The exact JSON contract the model must return. */
export function buildQuestionPrompt(request: QuestionRequest): string {
  const target = request.topic ? ` Topic to focus on: ${JSON.stringify(request.topic)}.` : "";
  const typeRule =
    request.type === "FILL_BLANK"
      ? 'For FILL_BLANK set "options" to an empty array and make "answer" the exact missing word or phrase.'
      : `For ${request.type} return between two and four "options" and make "answer" exactly equal to one of them.`;

  return [
    `Generate ${request.count} English-learning questions.`,
    `CEFR level: ${request.level}. Skill: ${request.skill}. Type: ${request.type}.${target}`,
    typeRule,
    'Return this shape: {"questions":[{"level","skill","type","prompt","options","answer","explanation","tags"}]}.',
    `Every question must use level "${request.level}", skill "${request.skill}" and type "${request.type}".`,
    "Add a one-sentence English explanation for the answer and up to four short lowercase tags.",
  ].join(" ");
}
