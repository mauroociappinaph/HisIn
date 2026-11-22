import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";
import { TopicRepository } from "@/modules/topics/repository";
import {
  GLOSSARY_SYSTEM_PROMPT,
  buildGlossaryPrompt,
  parseGlossary,
} from "@/modules/topics/glossary";

/**
 * Builds the glossary of a topic's story: Spanish translations plus the phrasal
 * verbs, patterns and collocations that appear in it as single units.
 *
 * Idempotent per topic, so re-running the whole syllabus is cheap and never
 * rewrites translations a learner has already seen.
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const repository = new TopicRepository();
  const topic = await repository.findBySlug(slug);
  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  if (topic.glosses.length > 0) {
    return NextResponse.json({ saved: 0, glosses: topic.glosses }, { status: 200 });
  }

  const story = topic.materials.find((material) => material.skill === "STORY");
  if (!story) return NextResponse.json({ error: "el tema todavía no tiene historia" }, { status: 409 });

  const row = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
  if (!row) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  const basePrompt = buildGlossaryPrompt({ title: story.title, body: story.body, level: topic.level });

  // One repair attempt: a reply that is structurally fine but breaks a rule is
  // retried with its own rejection, instead of failing the topic forever.
  let prompt = basePrompt;
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await runWithFallback({
        prompt,
        system: GLOSSARY_SYSTEM_PROMPT,
        timeoutMs: resolveTimeoutMs() * 2,
      });
      const glossary = parseGlossary(response.text);
      const saved = await repository.saveGlosses(row.id, glossary.entries);
      return NextResponse.json({ saved, glosses: glossary.entries, attempts: attempt }, { status: 201 });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      prompt = `${basePrompt} Your previous reply was rejected: ${lastError}. Fix exactly that and return the JSON again.`;
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}
