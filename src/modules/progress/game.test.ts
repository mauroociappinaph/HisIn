import assert from "node:assert/strict";
import { test } from "node:test";
import { levelFromXp, milestones, streakState, xpForLevel } from "./game";
import type { GameStats } from "./game";

const base: GameStats = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  itemsToday: 0,
  dailyGoal: 10,
  totalItems: 0,
  lessonsDone: 0,
  storiesRead: 0,
};

test("level 1 starts at zero and the first level costs 60 XP", () => {
  const state = levelFromXp(0);

  assert.equal(state.level, 1);
  assert.equal(state.span, 60);
  assert.equal(state.ratio, 0);
  assert.equal(state.remaining, 60);
});

test("crossing the level threshold advances and carries the surplus", () => {
  const state = levelFromXp(70);

  assert.equal(state.level, 2);
  assert.equal(state.into, 10);
  assert.equal(xpForLevel(2), 90);
});

test("the curve grows but stays reachable", () => {
  assert.ok(xpForLevel(2) > xpForLevel(1));
  assert.ok(xpForLevel(10) < 400);
});

test("a big XP amount lands deep without looping forever", () => {
  const state = levelFromXp(5000);

  assert.ok(state.level > 5);
  assert.ok(state.ratio >= 0 && state.ratio < 1);
});

test("negative or fractional XP is clamped, never NaN", () => {
  assert.equal(levelFromXp(-50).level, 1);
  assert.equal(levelFromXp(12.7).into, 12);
  assert.ok(Number.isFinite(levelFromXp(Number.NaN).remaining));
});

test("starting and streaks earn milestones", () => {
  const fresh = milestones(base);
  assert.equal(fresh.filter((m) => m.earned).length, 0);

  const started = milestones({ ...base, lessonsDone: 1, bestStreak: 2 });
  assert.deepEqual(
    started.filter((m) => m.earned).map((m) => m.id),
    ["first-lesson", "first-streak"],
  );
});

test("the long-term milestones need sustained practice", () => {
  const earned = milestones({
    ...base,
    bestStreak: 7,
    totalItems: 120,
    storiesRead: 2,
    xp: 600,
  })
    .filter((m) => m.earned)
    .map((m) => m.id);

  assert.ok(earned.includes("week-streak"));
  assert.ok(earned.includes("hundred-cards"));
  assert.ok(earned.includes("first-story"));
  assert.ok(earned.includes("level-5"));
});

test("the streak flame distinguishes a day practised from one missed", () => {
  assert.equal(streakState({ streak: 4, itemsToday: 2 }).active, true);
  assert.match(streakState({ streak: 4, itemsToday: 2 }).label, /4 días/);
  assert.equal(streakState({ streak: 4, itemsToday: 0 }).active, false);
  assert.match(streakState({ streak: 4, itemsToday: 0 }).label, /sin practicar/);
});
