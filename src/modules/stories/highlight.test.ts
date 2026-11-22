import assert from "node:assert/strict";
import { test } from "node:test";
import { highlightTerms } from "./highlight";

const BODY =
  "The runway is clear, so check in first. Our layover was short, but we did not put off the flight. Runway two stays busy.";

test("every term occurrence is highlighted, keeping the original casing", () => {
  const segments = highlightTerms(BODY, ["runway"]);

  assert.deepEqual(
    segments.filter((segment) => segment.match).map((segment) => segment.text),
    ["runway", "Runway"],
  );
});

test("the concatenation of all segments equals the body exactly", () => {
  for (const body of [BODY, "Mixed CASE words.", "", "line\nbreak\ttab.", "end."]) {
    const segments = highlightTerms(body, ["runway", "put off", "missing-term"]);
    assert.equal(segments.map((segment) => segment.text).join(""), body);
  }
});

test("matching is case-insensitive and respects word boundaries", () => {
  const segments = highlightTerms("We lay down after the layover.", ["lay"]);

  assert.deepEqual(segments, [
    { text: "We ", match: false },
    { text: "lay", match: true },
    { text: " down after the layover.", match: false },
  ]);
  assert.equal(segments.some((segment) => segment.match && segment.text.includes("layover")), false);
});

test("multiword terms match with different internal whitespace", () => {
  const segments = highlightTerms("Don't put   off the call. Never put\toff again.", ["put off"]);

  assert.deepEqual(
    segments.filter((segment) => segment.match).map((segment) => segment.text),
    ["put   off", "put\toff"],
  );
});

test("a term that never appears yields a single unmatched segment", () => {
  const segments = highlightTerms("Nothing to see here.", ["airport"]);

  assert.deepEqual(segments, [{ text: "Nothing to see here.", match: false }]);
});

test("an empty terms array yields a single unmatched segment", () => {
  const segments = highlightTerms("Nothing to see here.", []);

  assert.deepEqual(segments, [{ text: "Nothing to see here.", match: false }]);
});

test("overlapping candidates resolve to the longest match at a position", () => {
  const segments = highlightTerms("Do not put off work.", ["put", "put off"]);

  assert.deepEqual(segments, [
    { text: "Do not ", match: false },
    { text: "put off", match: true },
    { text: " work.", match: false },
  ]);
  assert.equal(segments.some((segment) => segment.match && segment.text === "put"), false);
});

test("matches sit next to punctuation without swallowing it", () => {
  const segments = highlightTerms("Check the runway.", ["runway"]);

  assert.deepEqual(segments, [
    { text: "Check the ", match: false },
    { text: "runway", match: true },
    { text: ".", match: false },
  ]);
});
