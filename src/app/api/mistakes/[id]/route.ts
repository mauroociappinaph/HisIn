import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { calculateSM2 } from "@/modules/vocabulary/srs";

/**
 * Grades one mistake: 0-5, the same scale the vocabulary scheduler uses.
 *
 * Three clean recalls in a row retire it; a failure puts it back to tomorrow, which
 * is the whole point of keeping mistakes instead of a list of corrections.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as { quality?: number } | null;
  const quality = Math.max(0, Math.min(5, Math.round(body?.quality ?? 3)));

  const user = await getLocalUser();
  const mistake = await prisma.mistake.findFirst({ where: { id, userId: user.id } });
  if (!mistake) return NextResponse.json({ error: "mistake not found" }, { status: 404 });

  const next = calculateSM2(mistake.easeFactor, mistake.interval, mistake.repetitions, quality);
  const resolved = quality >= 4 && next.repetitions >= 3;

  const updated = await prisma.mistake.update({
    where: { id: mistake.id },
    data: {
      easeFactor: next.easeFactor,
      interval: next.interval,
      repetitions: next.repetitions,
      nextReview: next.nextReview,
      resolved,
    },
  });

  return NextResponse.json({ mistake: updated, resolved }, { status: 200 });
}
