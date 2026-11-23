import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildExpansionPrompt,
  expansionKey,
  knownTopics,
  needsExpansion,
  parseExpansion,
} from "./hybrid";

const valid = {
  keywords: ["apology", "formal register", "apologise"],
  topics: ["corporate-writing", "present-simple-negative-questions"],
};

test("parseExpansion accepts a well-formed reply", () => {
  assert.equal(parseExpansion(JSON.stringify(valid)).keywords.length, 3);
});

test("parseExpansion tolerates fences", () => {
  assert.equal(parseExpansion("```json\n" + JSON.stringify(valid) + "\n```").topics.length, 2);
});

test("parseExpansion rejects a single keyword", () => {
  assert.throws(() => parseExpansion(JSON.stringify({ keywords: ["apology"], topics: [] })), /validation/);
});

test("knownTopics drops a lesson the course does not have", () => {
  const kept = knownTopics(parseExpansion(JSON.stringify(valid)), ["corporate-writing"]);
  assert.deepEqual(kept, ["corporate-writing"]);
});

test("expansionKey is stable across case and accents", () => {
  assert.equal(expansionKey("  Cómo pido DIS-CULPAS "), expansionKey("como pido dis culpas"));
});

test("needsExpansion fires when results are thin or shallow", () => {
  assert.equal(needsExpansion([]), true);
  assert.equal(needsExpansion([{ coverage: 1 }]), true);
  assert.equal(needsExpansion([{ coverage: 0.5 }, { coverage: 0.5 }, { coverage: 0.3 }]), true);
  assert.equal(needsExpansion([{ coverage: 1 }, { coverage: 1 }, { coverage: 0.3 }]), false);
});

test("the prompt carries the question and the lesson index", () => {
  const prompt = buildExpansionPrompt({
    query: "como pido disculpas formales",
    topics: [{ slug: "corporate-writing", title: "Corporate writing" }],
  });
  assert.match(prompt, /disculpas/);
  assert.match(prompt, /corporate-writing=Corporate writing/);
});
