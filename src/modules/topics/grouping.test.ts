import assert from "node:assert/strict";
import { test } from "node:test";
import { groupByUnit, topicLabel } from "./grouping";
import type { TopicDTO } from "./repository";

const topic = (over: Partial<TopicDTO>): TopicDTO => ({
  id: over.id ?? "id-s",
  slug: over.slug ?? "s",
  title: over.title ?? "T",
  order: over.order ?? 1,
  code: over.code ?? null,
  unit: over.unit ?? null,
  unitOrder: over.unitOrder ?? 0,
  level: "A2",
  focus: null,
  quote: null,
  materials: [],
  glosses: [],
  missing: [],
});

test("topics are grouped by module in module order", () => {
  const units = groupByUnit([
    topic({ slug: "c", order: 1, unit: "8 · Continuo", unitOrder: 8 }),
    topic({ slug: "a", order: 1, unit: "6 · Present simple", unitOrder: 6 }),
    topic({ slug: "b", order: 2, unit: "6 · Present simple", unitOrder: 6 }),
  ]);

  assert.deepEqual(
    units.map((unit) => unit.unit),
    ["6 · Present simple", "8 · Continuo"],
  );
  assert.deepEqual(
    units[0]?.topics.map((entry) => entry.slug),
    ["a", "b"],
  );
});

test("submodules keep their order inside a module", () => {
  const units = groupByUnit([
    topic({ slug: "tercero", order: 3, unit: "7 · Can", unitOrder: 7 }),
    topic({ slug: "primero", order: 1, unit: "7 · Can", unitOrder: 7 }),
    topic({ slug: "segundo", order: 2, unit: "7 · Can", unitOrder: 7 }),
  ]);

  assert.deepEqual(
    units[0]?.topics.map((entry) => entry.slug),
    ["primero", "segundo", "tercero"],
  );
});

test("topics without a module land in a fallback group, last", () => {
  const units = groupByUnit([
    topic({ slug: "suelto" }),
    topic({ slug: "agrupado", unit: "6 · Present simple", unitOrder: 6 }),
  ]);

  assert.equal(units.at(-1)?.unit, "Otros temas");
});

test("an empty syllabus produces no modules", () => {
  assert.deepEqual(groupByUnit([]), []);
});

test("the label prefers the owner's code over the ordinal", () => {
  assert.equal(topicLabel({ code: "6.2", order: 7 }), "6.2");
  assert.equal(topicLabel({ code: null, order: 7 }), "7");
});
