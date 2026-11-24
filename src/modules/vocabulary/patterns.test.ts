import assert from "node:assert/strict";
import { test } from "node:test";
import { FUNCTION_VALUES, REGISTER_VALUES, validateEntry } from "./entry";
import { PATTERN_SECTIONS, PATTERN_SEEDS, patternSectionViews } from "./patterns";
import { parseEntryAnalysis } from "./analysis";

/**
 * A pattern is a teaching unit, not a word: meaning, why it is used, register,
 * two examples and the mistake a Spanish speaker makes. These tests hold that
 * shape so a new pattern cannot enter the bank half-explained.
 */
test("every pattern seed fills every pattern section", () => {
  assert.ok(PATTERN_SEEDS.length > 0);

  for (const seed of PATTERN_SEEDS) {
    const views = patternSectionViews(seed);
    assert.deepEqual(
      views.map((view) => view.key),
      PATTERN_SECTIONS.map((section) => section.key),
      `${seed.term}: faltan secciones`,
    );
    for (const view of views) {
      assert.ok(view.value.trim().length > 0, `${seed.term}: "${view.key}" quedó vacío`);
    }

    const rules = validateEntry(seed);
    assert.equal(rules.ok, true, `${seed.term} no pasa las reglas del banco`);
  }
});

test("pattern seeds reuse the known function and register values", () => {
  for (const seed of PATTERN_SEEDS) {
    assert.ok((FUNCTION_VALUES as readonly string[]).includes(seed.function), `${seed.term}: función`);
    assert.ok((REGISTER_VALUES as readonly string[]).includes(seed.register), `${seed.term}: registro`);
  }
});

test("the pattern section order is the canonical one", () => {
  assert.deepEqual(
    PATTERN_SECTIONS.map((section) => section.key),
    ["definition", "function", "register", "example", "extraExample", "notes"],
  );
});

test("a pattern without a second example renders only the sections it has", () => {
  const views = patternSectionViews({ definition: "Encargarse de algo.", example: "We handle projects." });

  assert.deepEqual(
    views.map((view) => view.key),
    ["definition", "example"],
  );
});

test("the analyzed entry keeps the second example", () => {
  const reply = JSON.stringify({
    term: "runway",
    kind: "WORD",
    definition: "The time a company can keep operating before cash runs out.",
    example: "We have eleven months of runway left.",
    extraExample: "We handle projects end to end, from discovery to launch.",
    level: "B2",
    module: "business-english",
  });

  const result = parseEntryAnalysis(reply);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.analysis.extraExample, "We handle projects end to end, from discovery to launch.");
  }
});
