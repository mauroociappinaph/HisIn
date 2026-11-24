import assert from "node:assert/strict";
import { test } from "node:test";
import { AUTHORED_LESSON_CONTENT } from "./legacy-content";
import { canonicalizeLessonContent, isCompleteLessonContent, parseLessonContent } from "./structure";

/**
 * These entries rewrite lessons that already live in a database, so a malformed
 * one would replace real content with something worse. They obey exactly the
 * same rules as the seeded lessons.
 */
test("every authored lesson carries the five sections", () => {
  const keys = Object.keys(AUTHORED_LESSON_CONTENT);
  assert.ok(keys.length > 0);

  for (const key of keys) {
    const content = AUTHORED_LESSON_CONTENT[key] ?? "";
    assert.equal(isCompleteLessonContent(content), true, `${key}: falta una sección`);
    assert.equal(canonicalizeLessonContent(content), content, `${key}: no es canónica`);
  }
});

test("authored keys name the lesson they replace", () => {
  for (const key of Object.keys(AUTHORED_LESSON_CONTENT)) {
    const [module, level, ...rest] = key.split("|");
    assert.ok((module ?? "").length >= 2, `${key}: módulo`);
    assert.match(level ?? "", /^(A1|A2|B1|B2|C1|C2)$/, `${key}: nivel`);
    assert.ok(rest.join("|").trim().length >= 5, `${key}: título`);
  }
});

test("authored sections are more than a label", () => {
  for (const [key, content] of Object.entries(AUTHORED_LESSON_CONTENT)) {
    for (const section of parseLessonContent(content)) {
      assert.ok(section.body.length >= 10, `${key}: "${section.marker}" quedó vacío`);
    }
  }
});
