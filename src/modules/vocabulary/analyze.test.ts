import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeEntry } from "./analyze";

const fragmentAsPattern = JSON.stringify({
  term: "interested in",
  kind: "PATTERN",
  definition: "To want to know more about something or to be involved in it.",
  example: "The investors are interested in our retention data.",
  level: "B1",
  module: "business-english",
  function: "report",
});

const repaired = JSON.stringify({
  term: "be interested in + noun/gerund",
  kind: "PATTERN",
  definition: "To want to know more about something or to be involved in it.",
  example: "The investors are interested in reviewing our retention data.",
  level: "B1",
  module: "business-english",
  function: "report",
  notes: "En español se traduce con 'interesado en', sin el verbo be delante.",
});

test("a valid first reply is accepted without a second call", async () => {
  let calls = 0;
  const outcome = await analyzeEntry("be interested in", async () => {
    calls += 1;
    return repaired;
  });

  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 1);
  assert.equal(calls, 1);
  assert.equal(outcome.analysis?.term, "be interested in + noun/gerund");
});

test("a fragment returned as a pattern is repaired with the exact reason", async () => {
  const prompts: string[] = [];
  const outcome = await analyzeEntry("interested in", async (prompt) => {
    prompts.push(prompt);
    return prompts.length === 1 ? fragmentAsPattern : repaired;
  });

  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 2);
  assert.equal(prompts.length, 2);
  assert.doesNotMatch(prompts[0] ?? "", /previous answer was rejected/);
  assert.match(prompts[1] ?? "", /previous answer was rejected/);
  assert.match(prompts[1] ?? "", /necesita slots/);
});

test("the repair is bounded: two failures report the last reason instead of looping", async () => {
  let calls = 0;
  const outcome = await analyzeEntry("interested in", async () => {
    calls += 1;
    return fragmentAsPattern;
  });

  assert.equal(outcome.ok, false);
  assert.equal(outcome.attempts, 2);
  assert.equal(calls, 2);
  assert.match(String(outcome.error), /necesita slots/);
});

test("an engine failure is reported without retrying into a timeout", async () => {
  const outcome = await analyzeEntry("interested in", async () => {
    throw new Error("el motor no respondió: timeout");
  });

  assert.equal(outcome.ok, false);
  assert.equal(outcome.attempts, 1);
  assert.match(String(outcome.error), /timeout/);
});

test("a reply that is not JSON is repaired too", async () => {
  const prompts: string[] = [];
  const outcome = await analyzeEntry("cut corners", async (prompt) => {
    prompts.push(prompt);
    return prompts.length === 1 ? "no puedo clasificar eso" : JSON.stringify({
      term: "cut corners",
      kind: "IDIOM",
      definition: "To do something badly to save time or money.",
      example: "We cut corners on testing and the audit found it.",
      level: "C1",
      module: "business-english",
    });
  });

  assert.equal(outcome.ok, true);
  assert.equal(outcome.attempts, 2);
  assert.match(prompts[1] ?? "", /JSON/);
});
