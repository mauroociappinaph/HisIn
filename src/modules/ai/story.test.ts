import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generationRequestSchema,
  parseGeneratedStories,
  parseGeneratedVocabulary,
} from "./schema";

const body = [
  "Marta landed in Lisbon with a carry-on and a tight budget.",
  "Her first layover had taught her that a currency exchange counter can eat a whole morning,",
  "so she changed only what she needed and kept the rest for the week ahead.",
  "She put off booking a hostel until the last minute, which is how she ended up wandering the old town at dusk",
  "with her backpack on and no clear plan.",
  "On the third corner she found a bookshelf in a tiny cafe, ordered a coffee and bargained with the owner",
  "for a room upstairs.",
  "The elderly patron made her feel welcome, wrote the price on a napkin and promised to wake her before the market opened.",
].join(" ");

const validStory = {
  module: "vocabulary",
  level: "B1",
  title: "The Improvised Backpacker",
  body,
  translation:
    "Marta llega a Lisboa con poco presupuesto, improvisa alojamiento y termina negociando una habitación.",
  targetWords: ["layover", "currency exchange", "put off", "bargained", "elderly"],
};

test("a well formed story batch is accepted", () => {
  const stories = parseGeneratedStories(JSON.stringify({ stories: [validStory] }));

  assert.equal(stories.length, 1);
  assert.equal(stories[0]?.title, "The Improvised Backpacker");
  assert.deepEqual(stories[0]?.targetWords, validStory.targetWords);
});

test("a story that never uses one of its target words is rejected", () => {
  const broken = { ...validStory, targetWords: [...validStory.targetWords, "hitchhike"] };

  assert.throws(
    () => parseGeneratedStories(JSON.stringify({ stories: [broken] })),
    /target word "hitchhike" must appear in the body/,
  );
});

test("target words match regardless of case and word boundaries", () => {
  const story = { ...validStory, targetWords: ["Layover", "The Elderly", "wandering"] };

  assert.doesNotThrow(() => parseGeneratedStories(JSON.stringify({ stories: [story] })));
});

test("a target word only matches as a whole word", () => {
  const story = { ...validStory, targetWords: ["lay", "year", "care"] };

  assert.throws(
    () => parseGeneratedStories(JSON.stringify({ stories: [story] })),
    /target word "lay" must appear in the body/,
  );
});

test("a story whose body is too short to give context is rejected", () => {
  const broken = { ...validStory, body: "Marta paid the layover.", targetWords: ["layover"] };

  assert.throws(() => parseGeneratedStories(JSON.stringify({ stories: [broken] })));
});

test("a story with fewer than three target words is rejected", () => {
  const broken = { ...validStory, targetWords: ["layover", "put off"] };

  assert.throws(() => parseGeneratedStories(JSON.stringify({ stories: [broken] })));
});

test("repeated target words are rejected instead of silently deduplicated", () => {
  const broken = { ...validStory, targetWords: [...validStory.targetWords, "Layover"] };

  assert.throws(
    () => parseGeneratedStories(JSON.stringify({ stories: [broken] })),
    /target words must be unique/,
  );
});

test("a story request needs no skill or type", () => {
  const parsed = generationRequestSchema.safeParse({ kind: "story", level: "B1", count: 1 });

  assert.equal(parsed.success, true);
});

test("stories and vocabulary batches do not parse as each other", () => {
  const asVocabulary = JSON.stringify({
    vocabulary: [{ term: "layover", definition: "A stop between flights.", example: "A long layover." }],
  });

  assert.throws(() => parseGeneratedStories(asVocabulary));
  assert.throws(() => parseGeneratedVocabulary(JSON.stringify({ stories: [validStory] })));
});
