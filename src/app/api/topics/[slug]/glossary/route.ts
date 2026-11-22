import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
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

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no hay modelo configurado" }, { status: 500 });

  const row = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
  if (!row) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  try {
    const response = await runGentleShell({
      prompt: buildGlossaryPrompt({ title: story.title, body: story.body, level: topic.level }),
      system: GLOSSARY_SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs() * 2,
    });
    const glossary = parseGlossary(response.text);
    const saved = await repository.saveGlosses(row.id, glossary.entries);
    return NextResponse.json({ saved, glosses: glossary.entries }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
