import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { TopicRepository } from "@/modules/topics/repository";

/**
 * The opening quote of a submodule.
 *
 * One line, in English, tying the lesson to the module it belongs to: it gives
 * the page a voice before the grammar starts, and it is generated once and stored
 * so the same lesson always opens the same way.
 */
const SYSTEM_PROMPT =
  "You write one striking opening line for an English lesson. It is a quote a senior operator would say, in English, about the skill the lesson teaches. Return the line only: no quotes around it, no attribution, no explanation.";

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const repository = new TopicRepository();
  const topic = await repository.findBySlug(slug);
  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  const row = await prisma.topic.findUnique({ where: { slug }, select: { id: true, quote: true } });
  if (row?.quote) return NextResponse.json({ quote: row.quote, saved: false }, { status: 200 });

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no hay modelo configurado" }, { status: 500 });

  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");

  try {
    const response = await runGentleShell({
      prompt: [
        `Module: ${JSON.stringify(topic.unit ?? "the syllabus")}`,
        `Lesson: ${JSON.stringify(topic.title)} at CEFR ${topic.level}`,
        grammar ? `It teaches: ${JSON.stringify(grammar.keyPoints.slice(0, 2).join(" | "))}` : "",
        "Write one line of 14 to 30 words, first person or imperative, that makes a healthtech founder want to read the lesson.",
      ]
        .filter(Boolean)
        .join("\n"),
      system: SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs(),
    });

    const quote = response.text
      .trim()
      .replace(/^["“']|["”']$/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 220);

    if (quote.length < 20) {
      return NextResponse.json({ error: "la cita salió vacía" }, { status: 502 });
    }

    await prisma.topic.update({ where: { slug }, data: { quote } });
    return NextResponse.json({ quote, saved: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
