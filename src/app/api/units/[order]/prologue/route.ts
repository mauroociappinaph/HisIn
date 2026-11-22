import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { TopicRepository } from "@/modules/topics/repository";

/** The English prologue of one module: what the whole unit covers and why. */
const SYSTEM_PROMPT =
  "You write prologues for an English course for Spanish-speaking healthtech founders. English only, no Spanish, no headings, no markdown. Return the prose only.";

export async function POST(_req: NextRequest, context: { params: Promise<{ order: string }> }) {
  const { order } = await context.params;
  const unitOrder = Number(order);
  if (!Number.isFinite(unitOrder)) return NextResponse.json({ error: "invalid module" }, { status: 400 });

  const topics = (await new TopicRepository().list()).filter((topic) => topic.unitOrder === unitOrder);
  if (topics.length === 0) return NextResponse.json({ error: "module not found" }, { status: 404 });

  const existing = await prisma.unitMeta.findUnique({ where: { unitOrder }, select: { prologue: true } });
  if (existing?.prologue) return NextResponse.json({ prologue: existing.prologue, saved: false }, { status: 200 });

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no model configured" }, { status: 500 });

  const unitName = topics[0].unit ?? `Module ${unitOrder}`;

  try {
    const response = await runGentleShell({
      prompt: [
        `Module: ${JSON.stringify(unitName)}`,
        `Submodules: ${JSON.stringify(topics.map((topic) => topic.title))}`,
        "Write a prologue of 80 to 110 words, in English, that opens the module: the problem it solves, the order of the submodules and what changes for the learner by the end.",
        "Second person, plain English, no bullet lists.",
      ].join("\n"),
      system: SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs(),
    });

    const prologue = response.text.trim().replace(/\s+/g, " ").slice(0, 900);
    if (prologue.length < 80) return NextResponse.json({ error: "prologue too short" }, { status: 502 });

    await prisma.unitMeta.upsert({
      where: { unitOrder },
      update: { prologue, unit: unitName },
      create: { unitOrder, unit: unitName, prologue },
    });
    return NextResponse.json({ prologue, saved: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
