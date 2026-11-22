import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCloze, buildRound, createRng, scoreAnswer } from "./quiz";
import type { QuizItem } from "./quiz";

const items: QuizItem[] = [
  {
    id: "v1",
    term: "runway",
    definition: "Time until cash runs out.",
    example: "We have 12 months of runway.",
    module: "business-english",
    level: "B2",
  },
  {
    id: "v2",
    term: "due diligence",
    definition: "Investigation before a deal.",
    example: "Investors do due diligence before wiring funds.",
    module: "business-english",
    level: "C1",
  },
  {
    id: "v3",
    term: "patient",
    definition: "A person receiving medical care.",
    example: "The patient needs a check-up.",
    module: "vocabulary",
    level: "A1",
  },
  {
    id: "v4",
    term: "HIPAA",
    definition: "US law protecting patient health information.",
    example: "Ensure compliance with the privacy rules.",
    module: "vocabulary",
    level: "B1",
  },
];

// Deterministic stand-in for Math.random: always picks the first candidate.
const first = () => 0;

test("cloze hides the term inside its example, keeping the rest of the sentence", () => {
  const cloze = buildCloze("We have 12 months of runway.", "runway");

  assert.equal(cloze, "We have 12 months of ___.");
});

test("cloze matches case-insensitively and covers multiword terms", () => {
  assert.equal(
    buildCloze("Investors do Due Diligence before wiring funds.", "due diligence"),
    "Investors do ___ before wiring funds.",
  );
});

test("cloze returns null when the example never uses the term", () => {
  assert.equal(buildCloze("Ensure compliance with the privacy rules.", "HIPAA"), null);
});

test("a round has as many questions as requested", () => {
  const round = buildRound(items, { count: 3, rng: first });

  assert.equal(round.length, 3);
});

test("every question offers four options that include the answer exactly once", () => {
  const round = buildRound(items, { count: 6, rng: first });

  for (const question of round) {
    assert.equal(question.options.length, 4);
    const terms = question.options.map((option) => option.term);
    assert.equal(new Set(terms).size, 4);
    assert.equal(terms.filter((term) => term === question.answer).length, 1);
  }
});

test("a question with a usable example asks for the missing word", () => {
  const round = buildRound(items, { count: 4, rng: first });
  const runway = round.find((question) => question.vocabularyId === "v1");

  assert.ok(runway);
  assert.equal(runway.kind, "cloze");
  assert.equal(runway.prompt, "We have 12 months of ___.");
  assert.equal(runway.answer, "runway");
});

test("a question without a usable example falls back to the definition prompt", () => {
  const round = buildRound(items, { count: 4, rng: first });
  const hipaa = round.find((question) => question.vocabularyId === "v4");

  assert.ok(hipaa);
  assert.equal(hipaa.kind, "definition");
  assert.equal(hipaa.prompt, "US law protecting patient health information.");
  assert.equal(hipaa.answer, "HIPAA");
});

test("a small pool still yields distinct options, at least two", () => {
  const round = buildRound(items.slice(0, 2), { count: 1, rng: first });

  assert.equal(round.length, 1);
  assert.equal(round[0].options.length, 2);
  assert.equal(new Set(round[0].options.map((option) => option.term)).size, 2);
});

test("a correct answer pays ten XP plus two per streak level, capped at five levels", () => {
  const start = { xp: 0, streak: 0, best: 0 };

  const firstHit = scoreAnswer(start, true);
  assert.equal(firstHit.gained, 10);
  assert.deepEqual(firstHit.state, { xp: 10, streak: 1, best: 1 });

  const built = { xp: 100, streak: 5, best: 5 };
  const capped = scoreAnswer(built, true);
  assert.equal(capped.gained, 20);
  assert.deepEqual(capped.state, { xp: 120, streak: 6, best: 6 });
});

test("the seeded generator replays the same round for the same seed", () => {
  const first = buildRound(items, { count: 4, rng: createRng(7) });
  const second = buildRound(items, { count: 4, rng: createRng(7) });
  const other = buildRound(items, { count: 4, rng: createRng(8) });

  assert.deepEqual(first, second);
  assert.notDeepEqual(first, other);
});

test("a wrong answer pays nothing and resets the streak but keeps the best", () => {
  const result = scoreAnswer({ xp: 80, streak: 4, best: 4 }, false);

  assert.equal(result.gained, 0);
  assert.deepEqual(result.state, { xp: 80, streak: 0, best: 4 });
});
