import type { CefrLevel } from "@/shared/types";
import type { ClassMinutes } from "@/modules/classroom/design";

/**
 * A study module is a path, not a folder.
 *
 * Having 28 lessons and 11 grammar topics is content; a module is the answer to
 * "what do I do with this today": read, check the structure, practise it, and
 * come back to it on schedule. The four steps are ordered by what the evidence
 * says works (input, structure, retrieval, spaced review), and the minutes come
 * from the class context so a module fits the slot the learner actually has.
 */
export type StudyStepId = "read" | "grammar" | "practice" | "review";

export interface StudyStep {
  id: StudyStepId;
  title: string;
  detail: string;
  href: string;
  minutes: number;
}

export interface StudyModule {
  slug: string;
  title: string;
  objective: string;
  level: CefrLevel;
  steps: StudyStep[];
  minutes: number;
}

export interface StudyModuleInput {
  slug: string;
  title: string;
  objective: string;
  level: CefrLevel;
  minutes: ClassMinutes;
  grammarSlugs: string[];
  hasStories: boolean;
  vocabCount: number;
  questionCount: number;
}

const SHARES: Record<StudyStepId, number> = {
  read: 0.25,
  grammar: 0.2,
  practice: 0.35,
  review: 0.2,
};

/** Splits the session so the total is exact and no step is a rounding zero. */
function distribute(minutes: number): Record<StudyStepId, number> {
  const ids: StudyStepId[] = ["read", "grammar", "practice", "review"];
  const out = {} as Record<StudyStepId, number>;
  let assigned = 0;

  ids.forEach((id, index) => {
    if (index === ids.length - 1) {
      out[id] = Math.max(2, minutes - assigned);
      return;
    }
    const value = Math.max(2, Math.round(minutes * SHARES[id]));
    out[id] = value;
    assigned += value;
  });

  return out;
}

export function buildStudyModule(input: StudyModuleInput): StudyModule {
  const minutes = distribute(input.minutes);
  const grammarSlug = input.grammarSlugs[0];

  const steps: StudyStep[] = [
    {
      id: "read",
      title: "Leer la lección",
      detail: `Input del módulo ${input.title}: el texto que después vas a producir.`,
      href: `/lessons/${input.slug}`,
      minutes: minutes.read,
    },
    {
      id: "grammar",
      title: "Revisar la estructura",
      detail: grammarSlug
        ? "El tema de gramática que sostiene lo que vas a escribir."
        : "Todavía no hay gramática asociada; usá los patrones como referencia.",
      href: grammarSlug ? `/grammar/${grammarSlug}` : "/patterns",
      minutes: minutes.grammar,
    },
    {
      id: "practice",
      title: "Practicar",
      detail: `${input.questionCount} preguntas y ${input.vocabCount} entradas de vocabulario del módulo.`,
      href: `/practice/${input.slug}`,
      minutes: minutes.practice,
    },
    {
      id: "review",
      title: "Repasar en 48 h",
      detail: input.hasStories
        ? "Repaso espaciado más una historia del módulo para verlo en contexto."
        : "Repaso espaciado: lo que practicaste vuelve antes de que se olvide.",
      href: "/review/vocab",
      minutes: minutes.review,
    },
  ];

  return {
    slug: input.slug,
    title: input.title,
    objective: input.objective,
    level: input.level,
    steps,
    minutes: input.minutes,
  };
}

/**
 * Honest progress: how many of this module's lessons were marked as seen.
 * The other three steps are sessions, not certificates, so they are not faked
 * into a percentage.
 */
export function moduleProgress(
  completedLessonIds: readonly string[],
  moduleLessonIds: readonly string[],
): number {
  if (moduleLessonIds.length === 0) return 0;
  const done = moduleLessonIds.filter((id) => completedLessonIds.includes(id)).length;
  return Math.round((done / moduleLessonIds.length) * 100);
}
