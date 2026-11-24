import assert from "node:assert/strict";
import { test } from "node:test";
import {
  difficultyScore,
  findDuplicates,
  nextLesson,
  repeatedSentences,
  shingles,
  similarity,
  textSimilarity,
} from "./progression";

const memo = `To: product team. Our clinical pipeline is stable but slow, and the board wants the FDA
submission next month. The regulatory documents are complete, the dashboard is not, and the
team cannot ship both in the same sprint.`;

test("similarity is 1 for the same text and 0 for unrelated text", () => {
  assert.equal(similarity(shingles(memo), shingles(memo)), 1);
  assert.equal(similarity(shingles(memo), shingles("mutual fund performance in emerging markets")), 0);
});

test("textSimilarity catches the same memo with two nouns changed", () => {
  const rewritten = memo.replace("clinical pipeline", "clinical platform").replace("dashboard", "console");
  assert.ok(textSimilarity(memo, rewritten) > 0.7);
  assert.ok(textSimilarity(memo, "Mutual fund performance in emerging markets.") < 0.2);
});

test("findDuplicates only compares materials of the same skill", () => {
  const corpus = [
    { skill: "READING", body: memo, topicSlug: "a" },
    { skill: "STORY", body: memo, topicSlug: "b" },
  ];
  const hits = findDuplicates({ skill: "READING", body: memo }, corpus);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].topicSlug, "a");
});

test("findDuplicates ignores a material that says something else", () => {
  const corpus = [{ skill: "READING", body: memo, topicSlug: "a" }];
  const hits = findDuplicates({ skill: "READING", body: "A completely different text about aviation weather." }, corpus);
  assert.equal(hits.length, 0);
});

test("repeatedSentences finds the takeaway stated twice", () => {
  const body =
    "Always remember the auxiliary have before the past participle. The team shipped the build before the review. Always remember the auxiliary have before the past participle.";
  assert.equal(repeatedSentences(body).length, 1);
});

test("difficultyScore climbs with level and with position inside the module", () => {
  const first = difficultyScore({ level: "B1", unitOrder: 1, positionInModule: 1, moduleSize: 4 });
  const last = difficultyScore({ level: "B1", unitOrder: 1, positionInModule: 4, moduleSize: 4 });
  const c1 = difficultyScore({ level: "C1", unitOrder: 1, positionInModule: 1, moduleSize: 4 });
  assert.ok(first < last);
  assert.ok(last < c1);
  assert.equal(first >= 1 && c1 <= 100, true);
});

test("nextLesson returns the easiest lesson not done, never a harder one", () => {
  const topics = [
    { slug: "a2", level: "A2" as const, unitOrder: 1, order: 1, title: "A2" },
    { slug: "c1", level: "C1" as const, unitOrder: 2, order: 2, title: "C1" },
  ];
  assert.equal(nextLesson(topics, [])?.slug, "a2");
  assert.equal(nextLesson(topics, ["a2"])?.slug, "c1");
  assert.equal(nextLesson(topics, ["a2", "c1"]), null);
});
