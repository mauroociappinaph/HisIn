import assert from "node:assert/strict";
import { test } from "node:test";
import { FUNCTIONS, REGISTERS, validateUpdate } from "./update";

test("correcting the function of a pattern is accepted, including express", () => {
  const result = validateUpdate({ function: "express" });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.update.function, "express");
  assert.ok((FUNCTIONS as readonly string[]).includes("express"));
});

test("a function outside the taxonomy is refused with the allowed list", () => {
  const result = validateUpdate({ function: "explain" });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /hedge, soften, persuade, report, compare, express/);
});

test("clearing an optional field is allowed and stays null", () => {
  const result = validateUpdate({ notes: null, function: null });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.update.notes, null);
    assert.equal(result.update.function, null);
  }
});

test("an empty patch is refused instead of touching the row", () => {
  const result = validateUpdate({});

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /ningún campo/);
});

test("fields the learner must not rewrite in place are ignored", () => {
  const result = validateUpdate({ level: "C2", module: "contracts", source: "SEED", id: "x" });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /ningún campo/);
});

test("text fields keep their length rules", () => {
  assert.equal(validateUpdate({ definition: "corto" }).ok, false);
  assert.equal(validateUpdate({ definition: "A definition long enough to pass the rule." }).ok, true);
  assert.equal(validateUpdate({ notes: "x".repeat(401) }).ok, false);
});

test("registers are a closed list too", () => {
  assert.equal(validateUpdate({ register: "neutral" }).ok, true);
  assert.equal(validateUpdate({ register: "coloquial" }).ok, false);
  assert.ok((REGISTERS as readonly string[]).includes("formal"));
});

test("separable must be a boolean, not a string", () => {
  assert.equal(validateUpdate({ separable: true }).ok, true);
  assert.equal(validateUpdate({ separable: "si" }).ok, false);
});

test("the particle is normalised to lowercase", () => {
  const result = validateUpdate({ particle: "WITH" });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.update.particle, "with");
});
