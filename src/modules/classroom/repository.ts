import { prisma } from "@/shared/db/prisma";
import {
  buildLessonFlow,
  validateClassDesign,
  type ClassDesign,
  type LessonFlow,
} from "./design";

export interface ClassPlanDTO {
  id: string;
  topic: string;
  design: ClassDesign;
  flow: LessonFlow;
  createdAt: string;
}

/**
 * Class designs live on the learner profile, so every screen that generates a
 * plan works from the same context instead of asking again or inventing defaults.
 */
export class ClassroomRepository {
  async getDesign(userId: string): Promise<ClassDesign> {
    const profile = await prisma.learnerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return {
      discipline: profile.discipline as ClassDesign["discipline"],
      educationLevel: profile.educationLevel as ClassDesign["educationLevel"],
      minutes: profile.classMinutes as ClassDesign["minutes"],
      sequence: profile.sequence as ClassDesign["sequence"],
    };
  }

  async saveDesign(userId: string, input: Partial<ClassDesign>): Promise<ClassDesign> {
    const validation = validateClassDesign(input);
    if (!validation.ok || !validation.design) {
      throw new Error(validation.errors.join("; "));
    }
    const design = validation.design;
    await prisma.learnerProfile.upsert({
      where: { userId },
      update: {
        discipline: design.discipline,
        educationLevel: design.educationLevel,
        classMinutes: design.minutes,
        sequence: design.sequence,
      },
      create: {
        userId,
        discipline: design.discipline,
        educationLevel: design.educationLevel,
        classMinutes: design.minutes,
        sequence: design.sequence,
      },
    });
    return design;
  }

  /** Creates a plan from the stored design; the flow is snapshotted as JSON. */
  async createPlan(userId: string, topic: string): Promise<ClassPlanDTO> {
    const design = await this.getDesign(userId);
    const flow = buildLessonFlow(design);
    const row = await prisma.classPlan.create({
      data: {
        userId,
        discipline: design.discipline,
        educationLevel: design.educationLevel,
        minutes: design.minutes,
        sequence: design.sequence,
        topic: topic.trim(),
        flow: flow as unknown as object,
      },
    });
    return {
      id: row.id,
      topic: row.topic,
      design,
      flow,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listPlans(userId: string, limit = 12): Promise<ClassPlanDTO[]> {
    const rows = await prisma.classPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      design: {
        discipline: row.discipline as ClassDesign["discipline"],
        educationLevel: row.educationLevel as ClassDesign["educationLevel"],
        minutes: row.minutes as ClassDesign["minutes"],
        sequence: row.sequence as ClassDesign["sequence"],
      },
      flow: row.flow as unknown as LessonFlow,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
