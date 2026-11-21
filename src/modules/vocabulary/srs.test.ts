import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSM2 } from "./srs";

test("first successful review schedules the next repetition one day out", () => {
  const result = calculateSM2(2.5, 0, 0, 5);

  assert.equal(result.repetitions, 1);
  assert.equal(result.interval, 1);
});

test("second successful review moves to the six day step", () => {
  const result = calculateSM2(2.5, 1, 1, 4);

  assert.equal(result.repetitions, 2);
  assert.equal(result.interval, 6);
});

test("later successful reviews multiply the interval by the previous ease factor", () => {
  const result = calculateSM2(2.5, 6, 2, 5);

  assert.equal(result.repetitions, 3);
  assert.equal(result.interval, Math.round(6 * 2.5));
});

test("a failing grade resets repetitions and the interval", () => {
  const result = calculateSM2(2.5, 30, 5, 2);

  assert.equal(result.repetitions, 0);
  assert.equal(result.interval, 1);
});

test("the ease factor never drops below 1.3", () => {
  let easeFactor = 2.5;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    easeFactor = calculateSM2(easeFactor, 1, 0, 0).easeFactor;
  }

  assert.equal(easeFactor, 1.3);
});

test("the next review date is normalized to midnight and in the future", () => {
  const result = calculateSM2(2.5, 0, 0, 5);

  assert.equal(result.nextReview.getHours(), 0);
  assert.equal(result.nextReview.getMinutes(), 0);
  assert.ok(result.nextReview.getTime() > Date.now());
});

test("grades outside 0-5 are clamped instead of corrupting scheduling", () => {
  const high = calculateSM2(2.5, 1, 1, 99);
  const low = calculateSM2(2.5, 1, 1, -5);

  assert.equal(high.interval, 6);
  assert.equal(low.repetitions, 0);
});
