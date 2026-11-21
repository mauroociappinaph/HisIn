import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldTryNextModel } from "./policy";

const budget = 120_000;

test("a provider failure advances while budget remains", () => {
  assert.equal(
    shouldTryNextModel({ failure: "provider", elapsedMs: 5_000, totalBudgetMs: budget }),
    true,
  );
});

test("a slow provider advances instead of ending the generation", () => {
  // Regression: a free provider stalling past the per-attempt timeout used to
  // stop the chain, so a healthy fallback was never tried.
  assert.equal(
    shouldTryNextModel({ failure: "timeout", elapsedMs: 25_000, totalBudgetMs: budget }),
    true,
  );
});

test("an empty reply advances", () => {
  assert.equal(shouldTryNextModel({ failure: "empty", elapsedMs: 1_000, totalBudgetMs: budget }), true);
});

test("the chain stops once the total budget is spent", () => {
  assert.equal(
    shouldTryNextModel({ failure: "timeout", elapsedMs: budget, totalBudgetMs: budget }),
    false,
  );
  assert.equal(
    shouldTryNextModel({ failure: "provider", elapsedMs: budget + 1, totalBudgetMs: budget }),
    false,
  );
});

test("a missing executable never retries", () => {
  assert.equal(shouldTryNextModel({ failure: "spawn", elapsedMs: 10, totalBudgetMs: budget }), false);
});
