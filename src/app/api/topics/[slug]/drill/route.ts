import { NextRequest, NextResponse } from "next/server";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { parseGeneratedBatch } from "@/modules/ai/schema";
import { presentOptions } from "@/shared/lib/presentation";
import { TopicRepository } from "@/modules/topics/repository";

/**
 * Four quick items to check the rule you just read.
 *
 * Deliberately not stored: this is the "practice right after the rule" step, and
 * a fresh batch each time keeps it useful instead of memorized. It reuses the
 * engine's question pipeline so nothing unanswerable reaches the screen.
 */
const DRILL_SYSTEM_PROMPT = [
  "You write short English practice items for Spanish-speaking healthtech founders.",
  "Every item is set in that world: clinical products, investors, regulators, product launches, engineering work.",
  "Return ONLY a JSON object. No prose, no markdown fences.",
].join(" ");

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const topic = await new TopicRepository().findBySlug(slug);
  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no hay modelo configurado" }, { status: 500 });

  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");
  const prompt = [
    `Topic: ${JSON.stringify(topic.title)} at CEFR ${topic.level}.`,
    grammar ? `What the learner just read: ${JSON.stringify(grammar.keyPoints.join(" | "))}` : "",
    "Write 4 MULTIPLE_CHOICE items testing this exact topic, from recognition to production.",
    // The key must match BATCH_KEY.question, which is what the shared question
    // parser looks for; any other key parses as "no array here".
    'Return {"questions":[{"level","skill","type","prompt","options","answer","explanation","tags"}]}.',
    `level must be "${topic.level}", skill "GRAMMAR", type "MULTIPLE_CHOICE".`,
    "Each item has exactly 3 options and the answer is one of them, copied exactly.",
    "The prompt is a full sentence with a gap or a choice to make, never 'what is the rule'.",
    "explanation is one short sentence in Spanish saying why.",
    "Vary the difficulty: two straightforward, two that punish the Spanish-speaker error.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const response = await runGentleShell({
      prompt,
      system: DRILL_SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs() * 2,
    });

    const items = parseGeneratedBatch(response.text)
      .filter((question) => question.options.length >= 2 && question.options.includes(question.answer))
      .slice(0, 4)
      .map((question, index) => ({
        id: `${slug}-${index}`,
        prompt: question.prompt,
        options: presentOptions({ id: `${slug}-${index}`, options: question.options }),
        answer: question.answer,
        explanation: question.explanation ?? null,
      }));

    if (items.length === 0) {
      return NextResponse.json({ error: "el motor no devolvió ítems usables" }, { status: 502 });
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
