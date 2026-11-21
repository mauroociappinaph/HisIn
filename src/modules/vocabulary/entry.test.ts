import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEntry } from "./entry";
import type { EntryDraft } from "./entry";

const word: EntryDraft = {
  term: "runway",
  definition: "The time a company can keep operating before cash runs out.",
  example: "We have eleven months of runway left.",
  kind: "WORD",
  level: "B2",
  module: "business-english",
};

const phrasalVerb: EntryDraft = {
  term: "put off",
  definition: "To postpone something you had planned.",
  example: "We put off the launch until the audit was closed.",
  kind: "PHRASAL_VERB",
  level: "B1",
  module: "business-english",
};

const pattern: EntryDraft = {
  term: "make + object + verb",
  definition: "Causative: someone causes another person to do something.",
  example: "The auditor made the team redo the whole report.",
  kind: "PATTERN",
  level: "B2",
  module: "grammar",
};

test("a word enters as WORD with no particle", () => {
  const result = validateEntry(word);

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.particle, null);
});

test("a word with spaces is rejected as a single word", () => {
  const result = validateEntry({ ...word, term: "term sheet" });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /single word cannot contain spaces/);
});

test("a phrasal verb keeps its particle", () => {
  const result = validateEntry(phrasalVerb);

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.particle, "off");
});

test("verb plus preposition is accepted when the particle is a real one", () => {
  const result = validateEntry({ ...phrasalVerb, term: "look after", example: "She looks after the trial data." });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.particle, "after");
});

test("a phrasal verb whose last word is not a particle names that word", () => {
  const result = validateEntry({ ...phrasalVerb, term: "put sideway", example: "They put sideway the launch." });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /"sideway" is not a particle/);
});

test("a pattern needs slots", () => {
  assert.equal(validateEntry(pattern).ok, true);
  assert.equal(validateEntry({ ...pattern, term: "make sb do sth" }).ok, true);
  assert.equal(validateEntry({ ...pattern, term: "appreciate" }).ok, false);
  assert.equal(validateEntry({ ...pattern, term: "be used to" }).ok, false);
});

test("an example that never uses the entry is rejected", () => {
  const result = validateEntry({ ...word, example: "Cash is running low this quarter." });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /example must use "runway"/);
});

test("a pattern example is not required to repeat the slots literally", () => {
  const result = validateEntry({ ...pattern, example: "The regulator made us rewrite the label." });

  assert.equal(result.ok, true);
});

test("the level must be a CEFR level", () => {
  const result = validateEntry({ ...word, level: "Z9" as never });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /level must be one of/);
});

test("short or empty fields are rejected instead of saved", () => {
  assert.equal(validateEntry({ ...word, definition: "cash" }).ok, false);
  assert.equal(validateEntry({ ...word, term: "  " }).ok, false);
  assert.equal(validateEntry({ ...word, example: "" }).ok, false);
});
