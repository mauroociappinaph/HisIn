import assert from "node:assert/strict";
import { test } from "node:test";
import { applyProgress, dayKey, daysBetween, goalRatio, nextAction } from "./service";
import type { ProgressState } from "./service";

const idle: ProgressState = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  itemsToday: 0,
  totalItems: 0,
  totalCorrect: 0,
};

test("the first practice of a life starts a streak of one", () => {
  const next = applyProgress(idle, { xp: 10, items: 3, correct: 2 }, "2026-03-04");

  assert.equal(next.streak, 1);
  assert.equal(next.bestStreak, 1);
  assert.equal(next.xp, 10);
  assert.equal(next.itemsToday, 3);
  assert.equal(next.totalCorrect, 2);
});

test("a second session on the same day keeps the streak and adds to the day", () => {
  const state = { ...idle, streak: 4, bestStreak: 4, lastActiveDay: "2026-03-04", itemsToday: 5, xp: 50 };
  const next = applyProgress(state, { xp: 10, items: 2 }, "2026-03-04");

  assert.equal(next.streak, 4);
  assert.equal(next.itemsToday, 7);
  assert.equal(next.xp, 60);
});

test("a consecutive day extends the streak and resets the daily counter", () => {
  const state = { ...idle, streak: 4, bestStreak: 4, lastActiveDay: "2026-03-04", itemsToday: 12 };
  const next = applyProgress(state, { items: 3 }, "2026-03-05");

  assert.equal(next.streak, 5);
  assert.equal(next.bestStreak, 5);
  assert.equal(next.itemsToday, 3);
});

test("a skipped day restarts the streak at one but keeps the best", () => {
  const state = { ...idle, streak: 9, bestStreak: 9, lastActiveDay: "2026-03-04", itemsToday: 12 };
  const next = applyProgress(state, { items: 1 }, "2026-03-07");

  assert.equal(next.streak, 1);
  assert.equal(next.bestStreak, 9);
  assert.equal(next.itemsToday, 1);
});

test("days are counted across a month boundary", () => {
  assert.equal(daysBetween("2026-01-31", "2026-02-01"), 1);
  assert.equal(daysBetween("2026-02-28", "2026-03-01"), 1);
});

test("the day key is local and zero padded", () => {
  assert.equal(dayKey(new Date(2026, 2, 4, 23, 30)), "2026-03-04");
});

test("the review debt is the first next action", () => {
  const action = nextAction({ dueReviews: 3, itemsToday: 0, dailyGoal: 10, hasStory: true, nextLessonHref: "/x" });

  assert.equal(action.type, "review");
  assert.equal(action.href, "/review/vocab");
  assert.match(action.title, /3 palabras/);
});

test("one pending review reads in the singular", () => {
  assert.match(
    nextAction({ dueReviews: 1, itemsToday: 0, dailyGoal: 10, hasStory: false, nextLessonHref: null }).title,
    /1 palabra$/,
  );
});

test("without review debt, reading comes before new material", () => {
  const action = nextAction({ dueReviews: 0, itemsToday: 2, dailyGoal: 10, hasStory: true, nextLessonHref: "/lessons/x" });

  assert.equal(action.type, "story");
});

test("with no story available the next lesson is offered", () => {
  const action = nextAction({ dueReviews: 0, itemsToday: 2, dailyGoal: 10, hasStory: false, nextLessonHref: "/lessons/grammar" });

  assert.equal(action.type, "lesson");
  assert.equal(action.href, "/lessons/grammar");
});

test("a met goal closes the day but still offers a step", () => {
  const action = nextAction({ dueReviews: 0, itemsToday: 12, dailyGoal: 10, hasStory: true, nextLessonHref: "/x" });

  assert.equal(action.type, "done");
  assert.ok(action.href.length > 1);
});

test("the goal ratio is clamped so a banner never overflows", () => {
  assert.equal(goalRatio(0, 10), 0);
  assert.equal(goalRatio(5, 10), 0.5);
  assert.equal(goalRatio(25, 10), 1);
  assert.equal(goalRatio(3, 0), 1);
});
