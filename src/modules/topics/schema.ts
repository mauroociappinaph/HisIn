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
      // Domain anchor: the professional world the learner works in, not one fixed
      // vocabulary list. A pronunciation drill set in a stand-up is on-domain, a
      // radio exchange about wind shear is on-domain for an aviation module, and a
      // text about holidays is on-domain for nobody.
      const anchor =
        /health|clinical|patient|investor|startup|founder|saas|silicon valley|product|market|compliance|runway|pitch|office|meeting|team|client|demo|interview|sprint|hospital|clinic|hire|onboarding|launch|aviation|flight|aircraft|pilot|crew|atc|runway|tower|altitude|legal|law|contract|clause|court|liability|litigation|patent|trademark|jurisdiction|counsel|agreement|breach|medical|diagnosis|treatment|symptom|dose|prescription|trial|codebase|deployment|backend|frontend|database|api|server|incident|debug|repository|exam|ielts|toefl|cambridge|pte|rubric|band|score|candidate|assessment/i;
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
    "Set every material in the professional domain of the topic itself: aviation materials happen on a frequency, legal materials happen in a contract or a courtroom, software materials happen in a repository or an incident call, medical materials happen in a consultation or a ward.",
    "The GRAMMAR material must teach the structure its own title names. If the title is not a grammar structure (a skill, a domain or a task), teach the language that skill actually needs, never an unrelated tense.",
    "READING, WRITING and STORY must each use the structure the GRAMMAR teaches, at least three times, naturally.",
    'Each "body" is 120-400 words. GRAMMAR explains the rule, when it is used at work, and gives the Spanish-speaker error. READING is a short article or memo with the target structure. WRITING is a task with an explicit prompt and the structure to use. STORY is a 150-250 word narrative that uses the structure repeatedly in a healthtech or Silicon Valley situation, with a person, a problem and a decision.',
    "keyPoints: 2 to 6 short English takeaways the learner can apply tomorrow.",
    "Set every material's skill to exactly the requested value, in the requested order.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The pieces of the structure a GRAMMAR material actually taught.
 *
 * Taken from what the engine quoted and from the formula it wrote, so the same
 * text can be looked for in the reading, the writing task and the story. Without
 * this check a lesson can teach the third conditional and then never use it.
 */
export function structureMarkers(grammar: { body: string; keyPoints: readonly string[] }): string[] {
  const text = `${grammar.body} ${grammar.keyPoints.join(" ")}`;
  const quoted = [...text.matchAll(/'([^'\n]{3,60})'|“([^”\n]{3,60})”/g)]
    .map((match) => (match[1] ?? match[2] ?? "").trim().toLowerCase())
    .filter((value) => /\b(have|has|had|be|been|would|will|if|to|not|do|does|did|were|was)\b/.test(value));

  const unique = [...new Set(quoted)];
  return unique.slice(0, 8);
}

/** True when at least `min` of the taught markers appear in the text. */
export function usesStructure(body: string, markers: readonly string[], min = 1): boolean {
  if (markers.length === 0) return true;
  const text = body.toLowerCase();
  return markers.filter((marker) => text.includes(marker)).length >= min;
}

const TITLE_STOP = new Set([
  "the", "and", "for", "with", "from", "into", "of", "in", "on", "to", "a", "an",
  "basic", "advanced", "english", "lesson", "unit", "submodule",
]);

/**
 * The words that identify a topic, taken from its own title.
 *
 * Used to catch drift: a lesson called "Curriculum design and programme
 * evaluation" whose grammar material teaches "should have + past participle" is not
 * a lesson, it is a different lesson with the wrong title.
 */
export function topicKeywords(title: string): string[] {
  return [...new Set(
    title
      .toLowerCase()
      .replace(/[^a-z\s-]/g, " ")
      .split(/[\s-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 3 && !TITLE_STOP.has(word)),
  )];
}

/**
 * Titles that name a language structure rather than a domain or a skill.
 *
 * Their materials are expected to be about the structure, so "does it repeat the
 * title words" is the wrong question: a lesson on the present perfect uses it,
 * it does not say its name six times.
 */
const GRAMMAR_TITLE = /\b(tense|tenses|conditional|modal|modals|passive|perfect|simple|continuous|present|past|future|clause|clauses|pronoun|pronouns|article|articles|inversion|ellipsis|subjunctive|gerund|infinitive|causative|reported|speech|preposition|prepositions|imperative|imperatives|question|questions|negatives?|relatives?|comparatives?|superlatives?|adverbs?|phrasal|verb|verbs|connectors?|quantifiers?|determiners?|punctuation|homophones|word formation|spelling)\b/i;

export function isGrammarTopic(title: string): boolean {
  return GRAMMAR_TITLE.test(title);
}

/**
 * True when a material actually talks about its own topic.
 *
 * One keyword is enough: the point is to catch a material written for another
 * lesson, not to demand that every paragraph repeat the title.
 */
export function mentionsTopic(body: string, title: string): boolean {
  const keywords = topicKeywords(title);
  if (keywords.length === 0) return true;
  const text = body.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.slice(0, Math.max(4, keyword.length - 2))));
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
