import assert from "node:assert/strict";
import { test } from "node:test";
import { buildStudyModule, moduleProgress, type StudyModuleInput } from "./plan";

const input: StudyModuleInput = {
  slug: "business-english",
  title: "Business English",
  objective: "Escribir un board update de cinco líneas con evidencia.",
  level: "B2",
  minutes: 90,
  grammarSlugs: ["present-perfect"],
  hasStories: true,
  vocabCount: 12,
  questionCount: 9,
};

test("a study module always has the four steps in teaching order", () => {
  const studyPlan = buildStudyModule(input);

  assert.deepEqual(
    studyPlan.steps.map((step) => step.id),
    ["read", "grammar", "practice", "review"],
  );
});

test("the steps add up to the class duration, with no step below two minutes", () => {
  for (const minutes of [45, 60, 90, 120] as const) {
    const studyPlan = buildStudyModule({ ...input, minutes });
    const total = studyPlan.steps.reduce((sum, step) => sum + step.minutes, 0);

    assert.equal(total, minutes, `la suma de ${minutes} no coincide`);
    for (const step of studyPlan.steps) assert.ok(step.minutes >= 2);
  }
});

test("practice gets the biggest share and review is never zero", () => {
  const studyPlan = buildStudyModule(input);
  const practice = studyPlan.steps.find((step) => step.id === "practice");
  const review = studyPlan.steps.find((step) => step.id === "review");

  assert.ok(practice && practice.minutes > (studyPlan.steps.find((s) => s.id === "read")?.minutes ?? 0));
  assert.ok(review && review.minutes >= 2);
});

test("each step points at the right surface", () => {
  const studyPlan = buildStudyModule(input);
  const hrefs = Object.fromEntries(studyPlan.steps.map((step) => [step.id, step.href]));

  assert.equal(hrefs.read, "/lessons/business-english");
  assert.equal(hrefs.grammar, "/grammar/present-perfect");
  assert.equal(hrefs.practice, "/practice/business-english");
  assert.equal(hrefs.review, "/review/vocab");
});

test("without a grammar topic the step falls back to patterns instead of breaking", () => {
  const studyPlan = buildStudyModule({ ...input, grammarSlugs: [] });
  const grammar = studyPlan.steps.find((step) => step.id === "grammar");

  assert.equal(grammar?.href, "/patterns");
  assert.match(String(grammar?.detail), /patrones/);
});

test("the objective is carried into the module, not invented", () => {
  assert.equal(buildStudyModule(input).objective, input.objective);
});

test("module progress counts only lessons of that module", () => {
  assert.equal(moduleProgress([], ["a", "b"]), 0);
  assert.equal(moduleProgress(["a"], ["a", "b"]), 50);
  assert.equal(moduleProgress(["a", "b"], ["a", "b"]), 100);
  assert.equal(moduleProgress(["z"], ["a", "b"]), 0);
  assert.equal(moduleProgress(["a"], []), 0);
});
