import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEntryPrompt, entryInputFromAnalysis, parseEntryAnalysis, sectionFor } from "./analysis";

const phrased = {
  term: "put up with",
  kind: "PHRASAL_VERB",
  definition: "To tolerate something unpleasant without complaining.",
  example: "We put up with the slow vendor portal for a whole quarter.",
  level: "B2",
  module: "business-english",
  particle: "with",
  separable: false,
  register: "neutral",
  notes: "No se separa: no se dice 'put the delay up with'.",
};

test("a complete phrasal verb analysis is accepted and routed", () => {
  const result = parseEntryAnalysis(JSON.stringify(phrased));

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.kind, "PHRASAL_VERB");
    assert.deepEqual(sectionFor(result.kind), { href: "/phrasal-verbs", label: "Phrasal verbs" });
  }
});

test("an idiom is routed to the expressions view", () => {
  const result = parseEntryAnalysis(
    JSON.stringify({
      term: "cut corners",
      kind: "IDIOM",
      definition: "To do something badly to save time or money.",
      example: "We cut corners on testing and the audit found it.",
      level: "C1",
      module: "business-english",
      notes: "En español sería 'hacer las cosas a las apuradas'.",
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(sectionFor(result.kind).href, "/phrasal-verbs?tipo=expresiones");
});

test("a pattern is routed to patterns", () => {
  const result = parseEntryAnalysis(
    JSON.stringify({
      term: "make + object + verb",
      kind: "PATTERN",
      definition: "Causative: someone forces another person to act.",
      example: "The auditor made the team redo the report.",
      level: "B2",
      module: "grammar",
      function: "persuade",
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(sectionFor(result.kind).label, "Patrones");
});

test("an analysis that breaks the bank rules is refused with the reason", () => {
  const result = parseEntryAnalysis(
    JSON.stringify({ ...phrased, kind: "PHRASAL_VERB", particle: undefined, term: "put up with sideway" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /no es una partícula|no lleva espacios/);
});

test("an example that does not use the entry is refused", () => {
  const result = parseEntryAnalysis(JSON.stringify({ ...phrased, example: "The vendor portal was slow." }));

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /tiene que usar/);
});

test("a reply that is not JSON is refused instead of throwing", () => {
  const result = parseEntryAnalysis("no puedo clasificar eso");

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /JSON/);
});

test("the prompt closes the taxonomy and asks for the metadata each type needs", () => {
  const prompt = buildEntryPrompt("put up with");

  assert.match(prompt, /"WORD"/);
  assert.match(prompt, /"PHRASAL_VERB"/);
  assert.match(prompt, /"PATTERN"/);
  assert.match(prompt, /"IDIOM"/);
  assert.match(prompt, /particle/);
  assert.match(prompt, /"function"/);
});

test("an analyzed entry forwards every field, second example included", () => {
  const reply = JSON.stringify({
    term: "runway",
    kind: "WORD",
    definition: "The time a company can keep operating before cash runs out.",
    example: "We have eleven months of runway left.",
    extraExample: "We handle projects end to end, from discovery to launch.",
    level: "B2",
    module: "business-english",
  });

  const parsed = parseEntryAnalysis(reply);

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const input = entryInputFromAnalysis(parsed.analysis);

  assert.equal(input.extraExample, "We handle projects end to end, from discovery to launch.");
  assert.equal(input.notes, null);
  assert.equal(input.particle, null);
  assert.equal(input.kind, "WORD");
});
