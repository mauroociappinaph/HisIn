import { AssessmentRepository } from "./repository";
import type { CefrLevel, QuestionDTO } from "@/shared/types";

const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface AnswerInput {
  questionId: string;
  selected: string;
}

export interface AssessmentResult {
  level: CefrLevel;
  score: number;
  total: number;
  bySkill: Record<string, { correct: number; total: number }>;
}

export class AssessmentService {
  private repo = new AssessmentRepository();

  async getTestQuestions(count = 30): Promise<QuestionDTO[]> {
    // Distribute across levels and skills
    const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const perLevel = Math.floor(count / levels.length);
    const result: QuestionDTO[] = [];
    for (const lvl of levels) {
      const qs = await this.repo.findQuestions({ level: lvl, limit: perLevel + 2 });
      // pick a mix of skills
      result.push(...qs.slice(0, perLevel));
    }
    // shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result.slice(0, count);
  }

  async grade(answers: AnswerInput[]): Promise<AssessmentResult> {
    const bySkill: Record<string, { correct: number; total: number }> = {};
    let correct = 0;
    for (const a of answers) {
      const q = await this.repo.findById(a.questionId);
      if (!q) continue;
      const skill = q.skill;
      if (!bySkill[skill]) bySkill[skill] = { correct: 0, total: 0 };
      bySkill[skill].total += 1;
      if (q.answer === a.selected) {
        correct += 1;
        bySkill[skill].correct += 1;
      }
    }
    const total = answers.length;
    const pct = total > 0 ? correct / total : 0;
    // map pct to level
    let level: CefrLevel;
    if (pct < 0.2) level = "A1";
    else if (pct < 0.35) level = "A2";
    else if (pct < 0.5) level = "B1";
    else if (pct < 0.65) level = "B2";
    else if (pct < 0.8) level = "C1";
    else level = "C2";
    return { level, score: correct, total, bySkill };
  }

  levelIndex(level: CefrLevel): number {
    return LEVEL_ORDER.indexOf(level);
  }
}
