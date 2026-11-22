import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TOPIC_SKILLS,
  TOPIC_SYSTEM_PROMPT,
  buildTopicPrompt,
  parseTopicMaterials,
  structureMarkers,
  usesStructure,
} from "./schema";

const material = (skill: string) => ({
  skill,
  title: `${skill} del verbo to be`,
  body: `A founder walks into an investor meeting. The product is clinical software, the patient record is missing and the team is nervous. This material uses the verb to be in that exact situation, with the structure repeated so the learner can produce it at work.`,
  keyPoints: ["I am responsible for the rollout", "The patient is stable"],
});

const valid = {
  topic: "Verbo to be",
  level: "A2",
  materials: [material("GRAMMAR"), material("READING")],
};

test("a topic batch with domain-anchored materials is accepted", () => {
  const parsed = parseTopicMaterials(JSON.stringify(valid));

  assert.equal(parsed.topic, "Verbo to be");
  assert.equal(parsed.materials.length, 2);
  assert.ok(TOPIC_SKILLS.includes(parsed.materials[0]!.skill));
});

test("markdown fences are tolerated", () => {
  const raw = "```json\n" + JSON.stringify(valid) + "\n```";

  assert.equal(parseTopicMaterials(raw).materials.length, 2);
});

test("generic material without the domain is rejected", () => {
  const generic = {
    ...valid,
    materials: [
      { ...material("GRAMMAR"), body: "My name is Ana and my favourite colour is blue. The weather is nice today, my dog is friendly, and last summer we went to the beach with my cousins and ate ice cream every afternoon while the sun was shining." },
    ],
  };

  assert.throws(() => parseTopicMaterials(JSON.stringify(generic)), /no menciona el dominio/);
});

test("a repeated skill is rejected instead of silently overwriting", () => {
  const duplicated = { ...valid, materials: [material("GRAMMAR"), material("GRAMMAR")] };

  assert.throws(() => parseTopicMaterials(JSON.stringify(duplicated)), /repetido/);
});

test("an unknown skill is rejected", () => {
  const broken = { ...valid, materials: [material("SPEAKING")] };

  assert.throws(() => parseTopicMaterials(JSON.stringify(broken)));
});

test("a reply without JSON is rejected with a readable reason", () => {
  assert.throws(() => parseTopicMaterials("no puedo"), /no traía un objeto JSON/);
});

test("the prompt asks only for the missing skills and anchors the domain", () => {
  const prompt = buildTopicPrompt({ topic: "Verbo to be", level: "A2", skills: ["GRAMMAR", "STORY"] });

  assert.match(prompt, /Produce exactly these skills: GRAMMAR, STORY/);
  assert.match(prompt, /2 to 6 short English takeaways/);
  assert.match(TOPIC_SYSTEM_PROMPT, /healthtech founders/);
  assert.match(TOPIC_SYSTEM_PROMPT, /Never write generic textbook examples/);
});

test("a long syllabus title echoed by the model does not reject the batch", () => {
  const longTitle =
    "Pronombres personales sujeto (I, you, he...) y adjetivos posesivos (my, your, his...)";
  assert.ok(longTitle.length > 80);

  const parsed = parseTopicMaterials(JSON.stringify({ ...valid, topic: longTitle }));

  assert.equal(parsed.topic, longTitle);
  assert.equal(parsed.materials.length, 2);
});

test("structureMarkers keeps the quoted structures of a grammar material", () => {
  const markers = structureMarkers({
    body: "Use 'would have + past participle' and 'if we had implemented circuit breakers' in a post-mortem.",
    keyPoints: ["Say 'we should have deployed earlier'."],
  });
  assert.ok(markers.includes("would have + past participle"));
  assert.ok(markers.includes("if we had implemented circuit breakers"));
  assert.equal(markers.some((marker) => marker === "we should have deployed earlier"), true);
});

test("usesStructure detects a material that never uses what the grammar taught", () => {
  const markers = ["would have + past participle", "if we had implemented circuit breakers"];
  assert.equal(usesStructure("The outage started at 14:02 and the team paged the on-call engineer.", markers), false);
  assert.equal(usesStructure("We would have + past participle avoided it if we had implemented circuit breakers.", markers), true);
});
