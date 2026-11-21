import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTimestamp, youtubeDeepLink } from "./youtube";

test("a deep link opens the video at the given second", () => {
  assert.equal(youtubeDeepLink("dQw4w9WgXcQ", 83), "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=83s");
});

test("zero seconds still produces a usable link", () => {
  assert.equal(youtubeDeepLink("abc123", 0), "https://www.youtube.com/watch?v=abc123&t=0s");
});

test("negative or fractional seconds are clamped to a whole second", () => {
  assert.equal(youtubeDeepLink("abc123", -5), "https://www.youtube.com/watch?v=abc123&t=0s");
  assert.equal(youtubeDeepLink("abc123", 12.7), "https://www.youtube.com/watch?v=abc123&t=12s");
});

test("an empty id yields no link instead of a broken one", () => {
  assert.equal(youtubeDeepLink("   "), "");
});

test("timestamps are formatted the way a learner reads them", () => {
  assert.equal(formatTimestamp(0), "0:00");
  assert.equal(formatTimestamp(45), "0:45");
  assert.equal(formatTimestamp(83), "1:23");
  assert.equal(formatTimestamp(3600), "1:00:00");
  assert.equal(formatTimestamp(3723), "1:02:03");
});
