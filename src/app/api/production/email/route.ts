import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";
import { getLocalUser } from "@/modules/identity/service";
import { TopicRepository } from "@/modules/topics/repository";
import {
  CORRECTION_SYSTEM_PROMPT,
  buildCorrectionPrompt,
  linkableChanges,
  parseCorrection,
} from "@/modules/production/correction";

/**
 * Corrects a real email and files every mistake it finds.
 *
 * The correction is the answer the learner reads; the mistakes are what makes it
 * stick, because they come back in the review deck until they stop happening.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    audience?: string;
  } | null;

  const email = body?.email?.trim() ?? "";
  if (email.length < 40) {
    return NextResponse.json({ error: "write a little more, at least a full sentence" }, { status: 400 });
  }
  if (email.length > 4000) {
    return NextResponse.json({ error: "that email is longer than 4000 characters" }, { status: 400 });
  }

  const user = await getLocalUser();
  const topics = (await new TopicRepository().list()).map((topic) => ({ slug: topic.slug, title: topic.title }));

  const basePrompt = buildCorrectionPrompt({
    email,
    level: "B1-B2",
    audience: body?.audience,
    topics,
  });

  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const prompt =
      attempt === 1 ? basePrompt : `${basePrompt}\nYour previous reply was rejected: ${lastError}. Fix exactly that.`;
    try {
      const response = await runWithFallback({
        prompt,
        system: CORRECTION_SYSTEM_PROMPT,
        timeoutMs: resolveTimeoutMs() * 3,
      });
      const correction = parseCorrection(response.text);

      // Only changes that name a lesson the course actually has are linked, and the
      // same mistake is filed once: correcting the same email twice must not build
      // a deck of duplicates.
      const linkable = linkableChanges(
        correction.changes,
        topics.map((topic) => topic.slug),
      );
      const prepared = linkable.map((change) => ({
        userId: user.id,
        kind: change.kind,
        original: change.original,
        corrected: change.corrected,
        why: change.why,
        topicSlug: change.topicSlug ?? null,
        source: "email",
      }));

      if (prepared.length > 0) {
        await prisma.mistake.createMany({ data: prepared, skipDuplicates: true });
      }

      return NextResponse.json(
        { correction: { ...correction, changes: linkable }, saved: prepared.length, model: response.model },
        { status: 200 },
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}
