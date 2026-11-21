import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generationRequestSchema,
  parseGeneratedBatch,
  parseGeneratedLessons,
  parseGeneratedVocabulary,
} from "./schema";

const validChoiceQuestion = {
  level: "B1",
  skill: "VOCABULARY",
  type: "MULTIPLE_CHOICE",
  prompt: "What does 'runway' mean for a startup?",
  options: ["Time until cash runs out", "Office space", "Team size"],
  answer: "Time until cash runs out",
  explanation: "Runway is the number of months a company can operate before running out of cash.",
  tags: ["business", "finance"],
};

test("a well formed batch is accepted", () => {
  const questions = parseGeneratedBatch(JSON.stringify({ questions: [validChoiceQuestion] }));

  assert.equal(questions.length, 1);
  assert.equal(questions[0]?.answer, "Time until cash runs out");
});

test("markdown fences around the JSON are tolerated", () => {
  const raw = "```json\n" + JSON.stringify({ questions: [validChoiceQuestion] }) + "\n```";

  assert.equal(parseGeneratedBatch(raw).length, 1);
});

test("an answer that is not among the options is rejected", () => {
  const broken = { ...validChoiceQuestion, answer: "Something else" };

  assert.throws(
    () => parseGeneratedBatch(JSON.stringify({ questions: [broken] })),
    /answer must be one of the options/,
  );
});

test("a choice question with fewer than two options is rejected", () => {
  const broken = { ...validChoiceQuestion, options: ["Only one"], answer: "Only one" };

  assert.throws(
    () => parseGeneratedBatch(JSON.stringify({ questions: [broken] })),
    /need at least two options/,
  );
});

test("a fill in the blank question carrying options is rejected", () => {
  const broken = {
    level: "A2",
    skill: "GRAMMAR",
    type: "FILL_BLANK",
    prompt: "Complete: 'She ___ working now.'",
    options: ["is", "are"],
    answer: "is",
  };

  assert.throws(
    () => parseGeneratedBatch(JSON.stringify({ questions: [broken] })),
    /must not carry options/,
  );
});

test("a reply without any JSON object is rejected", () => {
  assert.throws(() => parseGeneratedBatch("I cannot help with that."), /did not contain a JSON object/);
});

test("malformed JSON is rejected", () => {
  assert.throws(() => parseGeneratedBatch("{ not json }"), /not valid JSON/);
});

test("an empty batch is rejected", () => {
  assert.throws(
    () => parseGeneratedBatch(JSON.stringify({ questions: [] })),
    /failed validation/,
  );
});

test("requests outside the supported enums are rejected", () => {
  assert.throws(
    () => parseGeneratedBatch(JSON.stringify({ questions: [{ ...validChoiceQuestion, level: "D1" }] })),
    /failed validation/,
  );
});

test("a question request without skill or type is rejected", () => {
  const result = generationRequestSchema.safeParse({ kind: "question", level: "B1", count: 2 });

  assert.equal(result.success, false);
});

test("vocabulary and lesson requests need no skill or type", () => {
  assert.equal(generationRequestSchema.safeParse({ kind: "vocabulary", level: "B2", count: 2 }).success, true);
  assert.equal(generationRequestSchema.safeParse({ kind: "lesson", level: "B2", count: 1 }).success, true);
});

test("the kind defaults to question so the old callers keep working", () => {
  const parsed = generationRequestSchema.safeParse({
    level: "B1",
    skill: "GRAMMAR",
    type: "TRUE_FALSE",
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.kind, "question");
});

test("a valid vocabulary batch is accepted", () => {
  const entries = parseGeneratedVocabulary(
    JSON.stringify({
      vocabulary: [
        {
          term: "runway",
          definition: "The number of months a company can operate before cash runs out.",
          example: "We have twelve months of runway after this round.",
          module: "vocabulary",
          level: "B2",
        },
      ],
    }),
  );

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.term, "runway");
});

test("a vocabulary entry with a one word definition is rejected", () => {
  assert.throws(
    () =>
      parseGeneratedVocabulary(
        JSON.stringify({
          vocabulary: [
            { term: "runway", definition: "money", example: "ok", module: "vocabulary", level: "B2" },
          ],
        }),
      ),
    /failed validation/,
  );
});

test("a valid lesson batch is accepted", () => {
  const lessons = parseGeneratedLessons(
    JSON.stringify({
      lessons: [
        {
          module: "business-english",
          level: "B2",
          title: "Writing an investor update",
          summary: "Short, honest updates that keep investors aligned.",
          content: "Lead with the headline.\nAdd metrics.\nName the risks.\nAsk for one thing.",
          order: 1,
        },
      ],
    }),
  );

  assert.equal(lessons.length, 1);
  assert.equal(lessons[0]?.order, 1);
});

test("a lesson without content is rejected", () => {
  assert.throws(
    () =>
      parseGeneratedLessons(
        JSON.stringify({
          lessons: [
            { module: "grammar", level: "B1", title: "Present perfect", summary: "Short summary here." },
          ],
        }),
      ),
    /failed validation/,
  );
});
