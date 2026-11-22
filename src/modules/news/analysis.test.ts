import assert from "node:assert/strict";
import { test } from "node:test";
import { buildNewsPrompt, parseNewsAnalysis } from "./analysis";

const valid = {
  summary:
    "Investors pulled back from digital health deals while startups stretch their runway and the FDA speeds up clearances.",
  level: "C1",
  vocabulary: [
    {
      term: "runway",
      definition: "The time a company can operate before its cash runs out.",
      example: "Startups are extending their runway by cutting hiring.",
    },
    {
      term: "clearance",
      definition: "Official authorisation to sell a medical device.",
      example: "The device received clearance after a short review.",
    },
    {
      term: "pull back",
      definition: "To reduce investment or involvement.",
      example: "Funds pulled back from telehealth deals in the third quarter.",
    },
  ],
  patterns: [
    {
      frame: "is expected to + verb",
      function: "report",
      example: "The market is expected to grow next year.",
      commonError: "En español se traduce con futuro simple, no con 'se espera que' literal.",
    },
  ],
};

test("a well formed analysis is accepted", () => {
  const analysis = parseNewsAnalysis(JSON.stringify(valid));

  assert.equal(analysis.level, "C1");
  assert.equal(analysis.vocabulary.length, 3);
  assert.equal(analysis.patterns[0]?.function, "report");
});

test("markdown fences around the JSON are tolerated", () => {
  const raw = "```json\n" + JSON.stringify(valid) + "\n```";

  assert.equal(parseNewsAnalysis(raw).vocabulary.length, 3);
});

test("a vocabulary example that never uses its term is rejected", () => {
  const broken = {
    ...valid,
    vocabulary: [
      { term: "runway", definition: "Cash runway of a company.", example: "Hiring slowed down." },
      ...valid.vocabulary.slice(1),
    ],
  };

  assert.throws(() => parseNewsAnalysis(JSON.stringify(broken)), /must use the term/);
});

test("a pattern without slots is rejected", () => {
  const broken = {
    ...valid,
    patterns: [{ ...valid.patterns[0], frame: "expected" }],
  };

  assert.throws(() => parseNewsAnalysis(JSON.stringify(broken)), /needs slots/);
});

test("an analysis with too little vocabulary is rejected", () => {
  const broken = { ...valid, vocabulary: valid.vocabulary.slice(0, 2) };

  assert.throws(() => parseNewsAnalysis(JSON.stringify(broken)));
});

test("a reply without a JSON object is rejected with a clear reason", () => {
  assert.throws(() => parseNewsAnalysis("no puedo analizar esto"), /did not contain a JSON object/);
});

test("the prompt anchors the analysis to the article text and the learner", () => {
  const prompt = buildNewsPrompt({
    title: "Digital health funding cools",
    source: "Fierce Healthcare",
    excerpt: "Investors pulled back from telehealth deals in the third quarter.",
  });

  assert.match(prompt, /Digital health funding cools/);
  assert.match(prompt, /Fierce Healthcare/);
  assert.match(prompt, /3 to 8 domain terms/);
  assert.match(prompt, /summary/);
});
