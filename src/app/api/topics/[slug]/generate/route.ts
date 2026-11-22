import { NextRequest, NextResponse } from "next/server";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { getLocalUser } from "@/modules/identity/service";
import { ClassroomRepository } from "@/modules/classroom/repository";
import { TopicRepository } from "@/modules/topics/repository";
import { TOPIC_SKILLS, TOPIC_SYSTEM_PROMPT, buildTopicPrompt, parseTopicMaterials } from "@/modules/topics/schema";

/**
 * Fills the missing skills of one topic with the engine.
 *
 * Only missing skills are requested, so a second call never rewrites material the
 * learner already read, and every material is validated against the domain rule
 * (healthtech / founders) before it is stored.
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const repository = new TopicRepository();
  const topic = await repository.findBySlug(slug);

  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });

  const wanted = topic.missing.length > 0 ? topic.missing : [...TOPIC_SKILLS];
  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no hay modelo configurado" }, { status: 500 });

  const user = await getLocalUser();
  const design = await new ClassroomRepository().getDesign(user.id);

  try {
    const response = await runGentleShell({
      prompt: buildTopicPrompt({
        topic: topic.title,
        level: topic.level,
        skills: wanted,
        focus: `${topic.focus ?? "healthtech"} · ${design.discipline} · ${design.educationLevel}`,
      }),
      system: TOPIC_SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs() * 3,
    });

    const payload = parseTopicMaterials(response.text);
    const row = await repository.ensureTopic({
      slug: topic.slug,
      title: topic.title,
      ord: topic.order,
      level: topic.level,
      focus: topic.focus ?? undefined,
      code: topic.code ?? undefined,
    });
    const saved = await repository.saveMaterials(row.id, payload);
    const fresh = await repository.findBySlug(topic.slug);

    return NextResponse.json({ saved, model: response.model, topic: fresh }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
