import { z } from "zod";
import { CEFR_LEVELS } from "@/modules/ai/schema";

/**
 * One syllabus topic, produced by the engine.
 *
 * The owner's requirement is one sentence long and it decides everything: every
 * skill for a topic must be written for healthtech founders and Silicon Valley
 * work, never for a generic learner. A topic is therefore four materials -
 * grammar, reading, listening, writing - that share the topic and the domain.
 */
export const TOPIC_SKILLS = ["GRAMMAR", "READING", "WRITING", "STORY"] as const;
export type TopicSkill = (typeof TOPIC_SKILLS)[number];

export const SKILL_LABELS: Record<TopicSkill, string> = {
  GRAMMAR: "Gramática",
  READING: "Reading",
  WRITING: "Writing",
  STORY: "Historia",
};

const materialShape = z.object({
  skill: z.enum(TOPIC_SKILLS),
  title: z.string().min(5).max(120),
  body: z.string().min(120).max(2500),
  keyPoints: z.array(z.string().min(8).max(160)).min(2).max(6),
});

export const topicMaterialsSchema = z
  .object({
    // The model echoes the topic title back; a long syllabus title is not a defect.
    topic: z.string().min(3).max(200),
    level: z.enum(CEFR_LEVELS),
    materials: z.array(materialShape).min(1).max(4),
  })
  .superRefine((payload, ctx) => {
    const seen = new Set<string>();
    for (const material of payload.materials) {
      if (seen.has(material.skill)) {
        ctx.addIssue({
          code: "custom",
          path: ["materials"],
          message: `el skill ${material.skill} está repetido`,
        });
      }
      seen.add(material.skill);
      // Without a domain anchor the material is generic filler, which is the
      // exact failure the owner rejected.
      // Domain anchor: the product world OR the workplace where it is spoken.
      // A pronunciation drill set in a stand-up is on-domain; a text about
      // holidays is not.
      const anchor =
        /health|clinical|patient|investor|startup|founder|saas|silicon valley|product|market|compliance|runway|pitch|office|meeting|team|client|demo|interview|sprint|hospital|clinic|hire|onboarding|launch/i;
      if (!anchor.test(material.body)) {
        ctx.addIssue({
          code: "custom",
          path: ["materials", material.skill],
          message: `${material.skill} no menciona el dominio healthtech/emprendimiento`,
        });
      }
    }
  });

export type TopicMaterials = z.infer<typeof topicMaterialsSchema>;

export const TOPIC_SYSTEM_PROMPT = [
  "You are an English teacher for Spanish-speaking healthtech founders and startup operators.",
  "Every material you write is set in that world: clinical products, investors, regulators, product launches, Silicon Valley work culture.",
  "Never write generic textbook examples about holidays, pets or the weather.",
  "Return ONLY a JSON object. No prose, no markdown fences, no comments.",
].join(" ");

/**
 * Builds the prompt for one topic and the skills still missing.
 *
 * Asking only for what is missing keeps a re-run cheap and makes the operation
 * idempotent: existing materials are never rewritten behind the learner's back.
 */
export function buildTopicPrompt(input: {
  topic: string;
  level: string;
  skills: TopicSkill[];
  focus?: string;
}): string {
  const skills = input.skills.join(", ");
  return [
    `Topic: ${JSON.stringify(input.topic)}`,
    `CEFR level: ${input.level}.`,
    input.focus ? `Course focus: ${JSON.stringify(input.focus)}.` : "",
    `Produce exactly these skills: ${skills}.`,
    'Return this shape: {"topic","level","materials":[{"skill","title","body","keyPoints"}]}.',
    'Each "body" is 120-400 words. GRAMMAR explains the rule, when it is used at work, and gives the Spanish-speaker error. READING is a short article or memo with the target structure. WRITING is a task with an explicit prompt and the structure to use. STORY is a 150-250 word narrative that uses the structure repeatedly in a healthtech or Silicon Valley situation, with a person, a problem and a decision.',
    "keyPoints: 2 to 6 short English takeaways the learner can apply tomorrow.",
    "Set every material's skill to exactly the requested value, in the requested order.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function parseTopicMaterials(raw: string): TopicMaterials {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("la respuesta del motor no traía un objeto JSON");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("la respuesta del motor no era JSON válido");
  }

  const result = topicMaterialsSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`la respuesta del motor no pasó la validación: ${issues}`);
  }
  return result.data;
}
