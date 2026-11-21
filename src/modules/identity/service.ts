import { prisma } from "@/shared/db/prisma";

/** The single identity this local-first app attributes progress to. */
export const LOCAL_USER_EMAIL = "local@hisin.app";

/**
 * Resolves the persisted local learner.
 *
 * VocabularyReview has a foreign key to User, so the app must reference a real
 * row instead of a magic string. Upsert keeps this idempotent across restarts
 * and a fresh database.
 */
export async function getLocalUser() {
  return prisma.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    update: {},
    create: { email: LOCAL_USER_EMAIL, name: "Local learner", level: "B1" },
  });
}
