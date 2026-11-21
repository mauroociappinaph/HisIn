import { prisma } from "@/shared/db/prisma";

export interface SRSInput {
  userId: string;
  vocabularyId: string;
  quality: number; // 0-5: 0=complete blackout, 5=perfect response
}

export interface SRSResult {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

/**
 * SM-2 Algorithm Implementation
 * 
 * quality scale (0-5):
 * 0 - complete blackout
 * 1 - incorrect response; correct answer recalled with difficulty
 * 2 - incorrect response; correct answer recalled easily
 * 3 - correct response with difficulty
 * 4 - correct response with hesitation
 * 5 - perfect response
 */
export function calculateSM2(
  easeFactor: number,
  interval: number,
  repetitions: number,
  quality: number
): SRSResult {
  // Ensure quality is within bounds
  const q = Math.max(0, Math.min(5, quality));

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  // Minimum ease factor is 1.3
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  if (q < 3) {
    // Failed - reset repetitions and interval
    newRepetitions = 0;
    newInterval = 1; // 1 day
  } else {
    // Passed
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(0, 0, 0, 0);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}

export async function reviewVocabulary(input: SRSInput): Promise<SRSResult> {
  // Get or create the vocabulary review record
  let review = await prisma.vocabularyReview.findUnique({
    where: {
      userId_vocabularyId: {
        userId: input.userId,
        vocabularyId: input.vocabularyId,
      },
    },
  });

  if (!review) {
    // First review - create with defaults
    const result = calculateSM2(2.5, 0, 0, input.quality);
    review = await prisma.vocabularyReview.create({
      data: {
        userId: input.userId,
        vocabularyId: input.vocabularyId,
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReview: result.nextReview,
        lastReviewed: new Date(),
      },
    });
    return result;
  }

  // Calculate new SRS values
  const result = calculateSM2(
    review.easeFactor,
    review.interval,
    review.repetitions,
    input.quality
  );

  // Update the review record
  await prisma.vocabularyReview.update({
    where: { id: review.id },
    data: {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastReviewed: new Date(),
    },
  });

  return result;
}

export async function getDueReviews(userId: string, limit = 20) {
  const now = new Date();
  return prisma.vocabularyReview.findMany({
    where: {
      userId,
      nextReview: { lte: now },
    },
    include: {
      vocabulary: true,
    },
    orderBy: { nextReview: "asc" },
    take: limit,
  });
}

export async function getReviewStats(userId: string) {
  const [total, due, learning, mature] = await Promise.all([
    prisma.vocabularyReview.count({ where: { userId } }),
    prisma.vocabularyReview.count({
      where: { userId, nextReview: { lte: new Date() } },
    }),
    prisma.vocabularyReview.count({
      where: { userId, repetitions: { lt: 3 } },
    }),
    prisma.vocabularyReview.count({
      where: { userId, interval: { gte: 21 } },
    }),
  ]);

  return { total, due, learning, mature };
}