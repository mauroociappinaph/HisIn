import assert from "node:assert/strict";
import { test } from "node:test";
import { presentOptions, resolveLevel } from "./presentation";
import type { CefrLevel } from "@/shared/types";

// A fixed sample of question ids so the shuffle distribution is pinned, not flaky.
const SAMPLE_IDS = [
  "q-001", "q-002", "q-003", "q-004", "q-005",
  "q-006", "q-007", "q-008", "q-009", "q-010",
  "q-011", "q-012", "q-013", "q-014", "q-015",
  "q-016", "q-017", "q-018", "q-019", "q-020",
];

const OPTS = ["correct", "wrong-1", "wrong-2", "wrong-3"];

test("presentOptions returns exactly the same multiset of options", () => {
  const presented = presentOptions({ id: "q-001", options: OPTS });

  assert.equal(presented.length, OPTS.length);
  assert.deepEqual([...presented].sort(), [...OPTS].sort());
  assert.equal(new Set(presented).size, OPTS.length);
});

test("presentOptions is deterministic for the same question id", () => {
  const first = presentOptions({ id: "q-007", options: OPTS });
  const second = presentOptions({ id: "q-007", options: OPTS });

  assert.deepEqual(first, second);
});

test("different question ids produce a different order", () => {
  const orders = SAMPLE_IDS.map((id) =>
    JSON.stringify(presentOptions({ id, options: OPTS })),
  );

  assert.equal(new Set(orders).size > 1, true);
});

test("the shuffle never leaves the correct answer pinned at index 0 across ids", () => {
  // The defect: 55% of stored questions keep the correct answer first.
  // With the answer stored first, at most a minority of ids may present it first.
  const atFirst = SAMPLE_IDS.filter(
    (id) => presentOptions({ id, options: OPTS })[0] === "correct",
  );

  assert.ok(atFirst.length < SAMPLE_IDS.length);
});

test("the identity permutation is not the norm across ids", () => {
  const identity = SAMPLE_IDS.filter(
    (id) => JSON.stringify(presentOptions({ id, options: OPTS })) === JSON.stringify(OPTS),
  );

  assert.ok(identity.length < SAMPLE_IDS.length);
});

test("the answer position is spread across the option slots", () => {
  const positions = new Set(
    SAMPLE_IDS.map((id) => presentOptions({ id, options: OPTS }).indexOf("correct")),
  );

  assert.ok(positions.size > 1);
});

test("presentOptions keeps short option lists unchanged", () => {
  assert.deepEqual(presentOptions({ id: "q-001", options: [] }), []);
  assert.deepEqual(presentOptions({ id: "q-001", options: ["only"] }), ["only"]);
});

test("an injected rng drives the shuffle instead of the id seed", () => {
  // rng always returning 0 swaps with position 0 every step: a cyclic rotation.
  const presented = presentOptions({ id: "q-001", options: OPTS }, () => 0);

  assert.deepEqual(presented, ["wrong-1", "wrong-2", "wrong-3", "correct"]);
});

test("resolveLevel returns an exact match", () => {
  const available: CefrLevel[] = ["A1", "B1", "C1"];

  assert.equal(resolveLevel("B1", available), "B1");
});

test("resolveLevel falls back to the nearest level below the target", () => {
  const available: CefrLevel[] = ["A1", "B1", "C1"];

  assert.equal(resolveLevel("C2", available), "C1");
  assert.equal(resolveLevel("B2", available), "B1");
});

test("resolveLevel falls back to the nearest level above when there is none below", () => {
  const available: CefrLevel[] = ["B1", "C1"];

  assert.equal(resolveLevel("A1", available), "B1");
});

test("resolveLevel returns null for an empty catalogue", () => {
  assert.equal(resolveLevel("C2", []), null);
});

test("resolveLevel tolerates duplicate levels in the catalogue", () => {
  const available: CefrLevel[] = ["C1", "C1", "A1", "A1"];

  assert.equal(resolveLevel("C2", available), "C1");
  assert.equal(resolveLevel("A1", available), "A1");
});
