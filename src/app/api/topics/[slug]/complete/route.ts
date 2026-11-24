import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";

/**
 * Marks a lesson done, or undoes it.
 *
 * Idempotent by construction: the unique row is the fact. The response always
 * says what the new state is, so the checkbox never guesses.
 */
export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = (await req.json().catch(() => null)) as { done?: boolean } | null;
  const done = body?.done ?? true;

  const topic = await prisma.topic.findUnique({ where: { slug }, select: { id: true, unit: true } });
  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  const user = await getLocalUser();

  if (done) {
    await prisma.topicCompletion.upsert({
      where: { userId_topicId: { userId: user.id, topicId: topic.id } },
      update: {},
      create: { userId: user.id, topicId: topic.id },
    });
  } else {
    await prisma.topicCompletion.deleteMany({ where: { userId: user.id, topicId: topic.id } });
  }

  const [completed, unitTotal] = await Promise.all([
    prisma.topicCompletion.count({ where: { userId: user.id, topic: { unit: topic.unit } } }),
    prisma.topic.count({ where: { unit: topic.unit } }),
  ]);

  return NextResponse.json({ done, completed, unitTotal }, { status: 200 });
}
