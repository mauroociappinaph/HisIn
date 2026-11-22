import { NextRequest, NextResponse } from "next/server";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { getLocalUser } from "@/modules/identity/service";
import { ClassroomRepository } from "@/modules/classroom/repository";
import { TopicRepository } from "@/modules/topics/repository";
import { findDuplicates } from "@/modules/topics/progression";
import {
  isGrammarTopic,
  mentionsTopic,
  TOPIC_SKILLS,
  TOPIC_SYSTEM_PROMPT,
  buildTopicPrompt,
  parseTopicMaterials,
  structureMarkers,
  usesStructure,
} from "@/modules/topics/schema";

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

    let payload = parseTopicMaterials(response.text);

    // Topic-fit gate: a material that never names its own topic was written for
    // another lesson. Checked first, because a coherent but wrong lesson is worse
    // than an incoherent one.
    // Only for domain and skill topics: a grammar lesson is allowed to teach the
    // structure without naming it.
    const drifted = isGrammarTopic(topic.title)
      ? []
      : payload.materials.filter((material) => !mentionsTopic(material.body, topic.title));
    if (drifted.length > 0) {
      const repair = `${buildTopicPrompt({
        topic: topic.title,
        level: topic.level,
        skills: wanted,
        focus: `${topic.focus ?? "healthtech"} · ${design.discipline} · ${design.educationLevel}`,
      })} The previous reply drifted from the topic: ${drifted
        .map((material) => material.skill)
        .join(", ")} never mention ${JSON.stringify(topic.title)}. Every material must be about this submodule and use its own terms; the GRAMMAR slot teaches the language patterns this skill needs, never an unrelated grammar point.`;
      const second = await runGentleShell({
        prompt: repair,
        system: TOPIC_SYSTEM_PROMPT,
        model,
        timeoutMs: resolveTimeoutMs() * 3,
      });
      payload = parseTopicMaterials(second.text);
    }

    // Consistency gate: the reading, the writing task and the story must actually
    // use the structure the grammar teaches. A lesson that explains the third
    // conditional and then never uses it teaches nothing, so the reply is retried
    // once with that exact defect named.
    const grammar = payload.materials.find((material) => material.skill === "GRAMMAR");
    if (grammar) {
      const markers = structureMarkers(grammar);
      const offenders = payload.materials.filter(
        (material) => material.skill !== "GRAMMAR" && !usesStructure(material.body, markers, 3),
      );
      if (offenders.length > 0 && markers.length > 0) {
        const repair = `${buildTopicPrompt({
          topic: topic.title,
          level: topic.level,
          skills: wanted,
          focus: `${topic.focus ?? "healthtech"} · ${design.discipline} · ${design.educationLevel}`,
        })} The previous reply taught ${JSON.stringify(markers.slice(0, 3))} in the GRAMMAR material but ${offenders
          .map((material) => material.skill)
          .join(", ")} never used it. Every material must use that structure at least three times, naturally.`;
        const second = await runGentleShell({
          prompt: repair,
          system: TOPIC_SYSTEM_PROMPT,
          model,
          timeoutMs: resolveTimeoutMs() * 3,
        });
        payload = parseTopicMaterials(second.text);
      }
    }
    const row = await repository.ensureTopic({
      slug: topic.slug,
      title: topic.title,
      ord: topic.order,
      level: topic.level,
      focus: topic.focus ?? undefined,
      code: topic.code ?? undefined,
      unit: topic.unit ?? undefined,
      unitOrder: topic.unitOrder,
    });
    // Repetition gate: a material that says what another lesson already says is
    // not new content, it is a second copy. The reply is retried once, naming the
    // lesson it was duplicating.
    const corpus = await repository.materialCorpus();
    const copies = payload.materials.flatMap((material) =>
      findDuplicates(material, corpus.filter((entry) => entry.topicSlug !== slug), 0.55).map((hit) => ({
        material,
        hit,
      })),
    );
    if (copies.length > 0) {
      const repair = `${buildTopicPrompt({
        topic: topic.title,
        level: topic.level,
        skills: wanted,
        focus: `${topic.focus ?? "healthtech"} · ${design.discipline} · ${design.educationLevel}`,
      })} The previous reply repeated existing content: ${copies
        .map((copy) => `${copy.material.skill} duplicates ${copy.hit.topicSlug}`)
        .join("; ")}. Write something genuinely new for those skills, from a different scene, angle and examples.`;
      const second = await runGentleShell({
        prompt: repair,
        system: TOPIC_SYSTEM_PROMPT,
        model,
        timeoutMs: resolveTimeoutMs() * 3,
      });
      payload = parseTopicMaterials(second.text);
    }

    const saved = await repository.saveMaterials(row.id, payload);
    const fresh = await repository.findBySlug(topic.slug);

    return NextResponse.json({ saved, model: response.model, topic: fresh }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
