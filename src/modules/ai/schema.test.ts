import assert from "node:assert/strict";
import { test } from "node:test";
import { parseGeneratedBatch } from "./schema";

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
