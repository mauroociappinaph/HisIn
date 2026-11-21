import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_MODEL, resolveMaxTotalMs, resolveModels, resolveTimeoutMs } from "./models";

test("without overrides the chain starts at the default model and includes a fallback", () => {
  const models = resolveModels({});

  assert.equal(models[0], DEFAULT_MODEL);
  assert.ok(models.length >= 2, "a single model is not a chain");
});

test("AI_MODEL becomes the head of the chain and is not duplicated", () => {
  const models = resolveModels({ AI_MODEL: "openai-codex/gpt-5.6-luna" });

  assert.equal(models[0], "openai-codex/gpt-5.6-luna");
  assert.equal(new Set(models).size, models.length);
});

test("AI_MODELS replaces the whole chain and preserves order", () => {
  const models = resolveModels({ AI_MODELS: "a/one, b/two ,a/one" });

  assert.deepEqual(models, ["a/one", "b/two"]);
});

test("a blank override falls back to the built-in chain", () => {
  const models = resolveModels({ AI_MODELS: "   " });

  assert.ok(models.length >= 2);
  assert.equal(models[0], DEFAULT_MODEL);
});

test("the per-attempt timeout defaults to 25 seconds and honours a valid override", () => {
  assert.equal(resolveTimeoutMs({}), 25_000);
  assert.equal(resolveTimeoutMs({ AI_TIMEOUT_MS: "12000" }), 12_000);
});

test("an invalid timeout override is ignored instead of disabling the bound", () => {
  assert.equal(resolveTimeoutMs({ AI_TIMEOUT_MS: "nope" }), 25_000);
  assert.equal(resolveTimeoutMs({ AI_TIMEOUT_MS: "0" }), 25_000);
  assert.equal(resolveTimeoutMs({ AI_TIMEOUT_MS: "-5" }), 25_000);
});

test("the total chain budget defaults to two minutes and can be raised", () => {
  assert.equal(resolveMaxTotalMs({}), 120_000);
  assert.equal(resolveMaxTotalMs({ AI_MAX_TOTAL_MS: "60000" }), 60_000);
  assert.equal(resolveMaxTotalMs({ AI_MAX_TOTAL_MS: "bogus" }), 120_000);
});
