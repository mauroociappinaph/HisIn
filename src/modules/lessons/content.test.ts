import assert from "node:assert/strict";
import { test } from "node:test";
import { LESSON_SEEDS } from "./content";
import { canonicalizeLessonContent, isCompleteLessonContent, parseLessonContent } from "./structure";

/**
 * The seeded lessons are the ones every learner reads first, so they are the
 * ones that must never drift out of the canonical structure.
 */
test("every seeded lesson carries all five sections", () => {
  assert.ok(LESSON_SEEDS.length > 0);

  for (const lesson of LESSON_SEEDS) {
    assert.equal(isCompleteLessonContent(lesson.content), true, `${lesson.title}: falta una sección`);
    assert.equal(lesson.content.length >= 50 && lesson.content.length <= 6000, true, `${lesson.title}: largo`);
  }
});

test("every seeded lesson is already canonical", () => {
  for (const lesson of LESSON_SEEDS) {
    assert.equal(canonicalizeLessonContent(lesson.content), lesson.content, `${lesson.title}: no es canónica`);
  }
});

test("seeded lessons stay identifiable and unique", () => {
  const seen = new Set<string>();

  for (const lesson of LESSON_SEEDS) {
    assert.ok(lesson.title.trim().length >= 5, "título demasiado corto");
    assert.ok(lesson.summary.trim().length > 0, `${lesson.title}: sin resumen`);
    const key = `${lesson.module}|${lesson.level}|${lesson.title}`;
    assert.equal(seen.has(key), false, `lección duplicada: ${key}`);
    seen.add(key);
  }
});

test("each section body is more than a label", () => {
  for (const lesson of LESSON_SEEDS) {
    for (const section of parseLessonContent(lesson.content)) {
      assert.ok(section.body.length >= 10, `${lesson.title}: "${section.marker}" quedó vacío`);
    }
  }
});
