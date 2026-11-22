import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";
import { TopicRepository } from "@/modules/topics/repository";

/**
 * A role-play the learner can do alone: a situation, your part, and a model
 * answer that uses the structure the lesson teaches.
 *
 * Speaking is the step every course skips because it needs a partner. A written
 * rehearsal with a model answer is not speaking, but it forces the same decision:
 * what do I actually say, in this situation, with this structure.
 */
const SYSTEM_PROMPT =
  "You build role-play drills for Spanish-speaking healthtech founders learning English. English only. Return ONLY a JSON object.";

const schema = z.object({
  situation: z.string().trim().min(30).max(500),
  yourRole: z.string().trim().min(10).max(200),
  theirRole: z.string().trim().min(10).max(200),
  model: z.string().trim().min(80).max(900),
  phrases: z.array(z.string().trim().min(3).max(80)).min(2).max(6),
});

function parse(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON in the reply");
  const parsed = schema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`role-play failed validation: ${issues}`);
  }
  return parsed.data;
}

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const topic = await new TopicRepository().findBySlug(slug);
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");

  try {
    const response = await runWithFallback({
      prompt: [
        `Lesson: ${JSON.stringify(topic.title)} at CEFR ${topic.level}.`,
        grammar ? `Structure to use: ${JSON.stringify(grammar.keyPoints.slice(0, 3).join(" | "))}` : "",
        'Return {"situation","yourRole","theirRole","model","phrases"}.',
        "The situation is one concrete scene at work, 40 to 70 words, with a deadline or a disagreement.",
        "yourRole and theirRole are one line each.",
        "model is what the learner should say: 60 to 90 words, using the structure of the lesson at least three times, spoken register.",
        "phrases: 3 to 5 chunks the learner can reuse in that scene.",
        "English only, no Spanish anywhere.",
      ]
        .filter(Boolean)
        .join("\n"),
      system: SYSTEM_PROMPT,
      timeoutMs: resolveTimeoutMs() * 2,
    });

    return NextResponse.json(parse(response.text), { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
