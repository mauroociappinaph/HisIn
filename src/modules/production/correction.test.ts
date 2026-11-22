import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CORRECTION_SYSTEM_PROMPT,
  buildCorrectionPrompt,
  linkableChanges,
  overallScore,
  parseCorrection,
} from "./correction";

const valid = {
  corrected:
    "Hi Dr. Smith, I'd like to flag that our platform does not yet work with your EHR, and we will resolve it by Friday.",
  summary: "Clear ask, but two grammar errors and too direct for a clinical partner.",
  register: "too-informal",
  scores: { grammar: 3, vocabulary: 3, register: 2, cohesion: 4 },
  changes: [
    {
      kind: "grammar",
      original: "our platform don't work",
      corrected: "our platform doesn't work",
      why: "Third person singular takes does, so the main verb stays in the base form.",
      topicSlug: "present-simple-negative-questions",
    },
  ],
};

test("parseCorrection accepts a well-formed correction", () => {
  const correction = parseCorrection(JSON.stringify(valid));
  assert.equal(correction.changes.length, 1);
  assert.equal(correction.register, "too-informal");
});

test("parseCorrection tolerates markdown fences and surrounding prose", () => {
  const raw = "Here is the JSON:\n```json\n" + JSON.stringify(valid) + "\n```\nDone.";
  assert.equal(parseCorrection(raw).scores.grammar, 3);
});

test("parseCorrection rejects an unknown change kind", () => {
  const broken = { ...valid, changes: [{ ...valid.changes[0], kind: "style" }] };
  assert.throws(() => parseCorrection(JSON.stringify(broken)), /validation/);
});

test("parseCorrection rejects a score out of range", () => {
  const broken = { ...valid, scores: { ...valid.scores, grammar: 9 } };
  assert.throws(() => parseCorrection(JSON.stringify(broken)), /validation/);
});

test("overallScore averages the four criteria to one decimal", () => {
  assert.equal(overallScore(valid), 3);
  assert.equal(
    overallScore({ scores: { grammar: 3, vocabulary: 4, register: 3, cohesion: 5 } }),
    3.8,
  );
});

test("buildCorrectionPrompt carries the audience, the email and the lesson index", () => {
  const prompt = buildCorrectionPrompt({
    email: "Hello, our platform don't work.",
    level: "B1",
    audience: "clinical partner",
    topics: [{ slug: "present-simple-negative-questions", title: "Present simple: negatives and questions" }],
  });
  assert.match(prompt, /clinical partner/);
  assert.match(prompt, /don't work/);
  assert.match(prompt, /present-simple-negative-questions=Present simple/);
});

test("the system prompt forbids rewriting for taste", () => {
  assert.match(CORRECTION_SYSTEM_PROMPT, /no rewriting for taste/i);
});

test("linkableChanges drops a lesson that does not exist", () => {
  const changes = linkableChanges(
    [
      { kind: "grammar", original: "dont work", corrected: "doesn't work", why: "third person takes does", topicSlug: "invented-lesson" },
    ],
    ["present-simple-negative-questions"],
  );
  assert.equal(changes.length, 1);
  assert.equal(changes[0].topicSlug, undefined);
});

test("linkableChanges keeps a lesson that exists", () => {
  const changes = linkableChanges(
    [{ kind: "grammar", original: "dont work", corrected: "doesn't work", why: "third person takes does", topicSlug: "present-simple-negative-questions" }],
    ["present-simple-negative-questions"],
  );
  assert.equal(changes[0].topicSlug, "present-simple-negative-questions");
});

test("linkableChanges files the same wrong fragment once, even with two corrections", () => {
  const first = { kind: "grammar" as const, original: "dont work", corrected: "doesn't work", why: "third person takes does" };
  const second = { ...first, original: "Dont work", corrected: "does not integrate" };
  assert.equal(linkableChanges([first, second], []).length, 1);
});
