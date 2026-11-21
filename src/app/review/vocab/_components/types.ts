import type { VocabularyDTO } from "@/shared/types";

export interface VocabReviewItem {
  id: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  vocabulary: VocabularyDTO;
}

export interface ReviewStats {
  total: number;
  due: number;
  learning: number;
  mature: number;
}

export type TrainerMode = "review" | "explore" | "challenge";
