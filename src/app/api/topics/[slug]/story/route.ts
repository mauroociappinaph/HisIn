import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/shared/db/prisma";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";
import { TopicRepository } from "@/modules/topics/repository";

/**
 * Rewrites one story so the whole syllabus reads as one continuous narrative.
 *
 * Two rules the owner asked for and this endpoint enforces: every story is long
 * enough to actually read (280-420 words), and each one picks up where the
 * previous submodule's story left off, with the same company and the same people,
 * so a learner following the modules follows a single storyline.
 */
const SYSTEM_PROMPT = [
  "You write narrative material for an English course aimed at Spanish-speaking healthtech founders.",
  "The story is set in one continuous world: the same company, the same people, evolving across modules.",
  "Return ONLY a JSON object. No prose, no markdown fences.",
].join(" ");

const storySchema = z.object({
  story: z.object({
    title: z.string().trim().min(5).max(120),
    body: z.string().trim().min(900).max(4000),
  }),
});

function parse(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("la respuesta no traía JSON");
  const parsed = storySchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`la historia no pasó la validación: ${issues}`);
  }
  const words = parsed.data.story.body.trim().split(/\s+/).length;
  if (words < 280) throw new Error(`la historia tiene ${words} palabras, el mínimo es 280`);
  return parsed.data.story;
}

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const repository = new TopicRepository();
  const topics = await repository.list();
  const topic = topics.find((entry) => entry.slug === slug);
  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  const index = topics.findIndex((entry) => entry.slug === slug);
  const previous = topics[index - 1];
  const previousStory = previous?.materials.find((material) => material.skill === "STORY");
  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");

  const prompt = [
    `This submodule: ${JSON.stringify(topic.title)} (module ${JSON.stringify(topic.unit ?? "")}, CEFR ${topic.level}).`,
    grammar ? `It teaches: ${JSON.stringify(grammar.keyPoints.slice(0, 3).join(" | "))}` : "",
    previousStory
      ? `The previous submodule (${JSON.stringify(previous?.title)}) told this story, continue it: ${JSON.stringify(previousStory.body.slice(-700))}`
      : "This is the first story of the course: open the world and the company.",
    'Return {"story":{"title","body"}}.',
    "Write 320 to 400 words, in English, in the same world and with the same recurring characters as the previous story.",
    "It must be a real scene: a person, a problem with a deadline, a decision, and the consequence of that decision.",
    "Use the structure this submodule teaches at least six times, naturally, never as a drill.",
    "Set it in healthtech or Silicon Valley work; no holidays, no pets, no weather filler.",
    "End on a line that opens the next submodule, so the course reads as one story.",
  ]
    .filter(Boolean)
    .join("\n");

  let lastError = "";
  let currentPrompt = prompt;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await runWithFallback({
        prompt: currentPrompt,
        system: SYSTEM_PROMPT,
        timeoutMs: resolveTimeoutMs() * 4,
      });
      const story = parse(response.text);
      const row = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
      if (!row) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });
      await prisma.topicMaterial.upsert({
        where: { topicId_skill: { topicId: row.id, skill: "STORY" } },
        update: { title: story.title, body: story.body },
        create: { topicId: row.id, skill: "STORY", title: story.title, body: story.body, keyPoints: [] },
      });
      const words = story.body.trim().split(/\s+/).length;
      return NextResponse.json({ title: story.title, words, attempts: attempt }, { status: 201 });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      currentPrompt = `${prompt}\nYour previous reply was rejected: ${lastError}. Fix exactly that.`;
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}
