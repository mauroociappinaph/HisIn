import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt } from "./prompt";
import { generationRequestSchema } from "./schema";

const base = { kind: "lesson" as const, level: "B2" as const, count: 1 };

test("without a context the prompt is exactly the kind prompt", () => {
  const prompt = buildPrompt(base);

  assert.match(prompt, /Generate 1 short English lessons/);
  assert.doesNotMatch(prompt, /Audience:/);
});

test("a class context is appended to any kind's prompt", () => {
  const context = "Audience: salud posgrado students. Session length: 90 minutes (part of a weekly sequence).";
  const lesson = buildPrompt({ ...base, context });
  const vocabulary = buildPrompt({ ...base, kind: "vocabulary", context });
  const story = buildPrompt({ ...base, kind: "story", context });

  for (const prompt of [lesson, vocabulary, story]) {
    assert.match(prompt, /Audience: salud posgrado students/);
    assert.match(prompt, /90 minutes/);
  }
});

test("the request accepts a context and rejects an oversized one", () => {
  assert.equal(generationRequestSchema.safeParse({ ...base, context: "Audience: negocios." }).success, true);
  assert.equal(generationRequestSchema.safeParse({ ...base, context: "x".repeat(401) }).success, false);
});
