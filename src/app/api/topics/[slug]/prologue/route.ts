import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { TopicRepository } from "@/modules/topics/repository";

/** The English prologue of one submodule: what it is for, in the learner's world. */
const SYSTEM_PROMPT =
  "You write prologues for an English course for Spanish-speaking healthtech founders. English only, no Spanish, no headings, no markdown. Return the prose only.";

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const topic = await new TopicRepository().findBySlug(slug);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const row = await prisma.topic.findUnique({ where: { slug }, select: { id: true, prologue: true } });
  if (row?.prologue) return NextResponse.json({ prologue: row.prologue, saved: false }, { status: 200 });

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no model configured" }, { status: 500 });

  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");

  try {
    const response = await runGentleShell({
      prompt: [
        `Module: ${JSON.stringify(topic.unit ?? "")}`,
        `Submodule: ${JSON.stringify(topic.title)} at CEFR ${topic.level}`,
        grammar ? `It teaches: ${JSON.stringify(grammar.keyPoints.slice(0, 3).join(" | "))}` : "",
        "Write a prologue of 60 to 90 words, in English, that opens the submodule: what it is, why it matters in a healthtech or Silicon Valley job, and what the learner will be able to do at the end.",
        "Second person, plain English, no bullet lists.",
      ]
        .filter(Boolean)
        .join("\n"),
      system: SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs(),
    });

    const prologue = response.text.trim().replace(/\s+/g, " ").slice(0, 700);
    if (prologue.length < 60) return NextResponse.json({ error: "prologue too short" }, { status: 502 });

    await prisma.topic.update({ where: { slug }, data: { prologue } });
    return NextResponse.json({ prologue, saved: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
