export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: "Principiante",
  A2: "Básico",
  B1: "Intermedio",
  B2: "Intermedio alto",
  C1: "Avanzado",
  C2: "Maestría",
};

export type Skill =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "BUSINESS"
  | "CONTRACTS";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "TRUE_FALSE"
  | "LISTENING_MCQ";

export interface QuestionDTO {
  id: string;
  level: CefrLevel;
  skill: Skill;
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string | null;
  audioUrl?: string | null;
  tags: string[];
}

export interface LessonDTO {
  id: string;
  module: string;
  level: CefrLevel;
  title: string;
  summary: string;
  content: string;
  order: number;
}

export type VocabularyKind = "WORD" | "PHRASAL_VERB" | "PATTERN";
export type VocabularySource = "SEED" | "GENERATED" | "USER";

export interface VocabularyDTO {
  id: string;
  term: string;
  definition: string;
  example: string;
  module: string;
  level: CefrLevel;
  kind: VocabularyKind;
  source: VocabularySource;
  particle?: string;
  separable?: boolean;
  register?: string;
  function?: string;
  extraExample?: string;
  notes?: string;
}

export interface StoryDTO {
  id: string;
  module: string;
  level: CefrLevel;
  title: string;
  body: string;
  translation: string;
  targetWords: string[];
}

export interface ModuleDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}
