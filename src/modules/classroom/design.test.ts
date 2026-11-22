import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLASS_MINUTES,
  DISCIPLINES,
  buildLessonFlow,
  describeDesign,
  validateClassDesign,
  type ClassDesign,
} from "./design";

const base: ClassDesign = {
  discipline: "negocios",
  educationLevel: "posgrado",
  minutes: 90,
  sequence: "semanal",
};

test("every supported duration adds up to exactly that duration", () => {
  for (const minutes of CLASS_MINUTES) {
    const flow = buildLessonFlow({ ...base, minutes });
    const total = flow.blocks.reduce((sum, block) => sum + block.minutes, 0);
    assert.equal(total, minutes, `la suma de ${minutes} no coincide`);
  }
});

test("every session keeps the five phases in teaching order", () => {
  const flow = buildLessonFlow(base);

  assert.deepEqual(
    flow.blocks.map((block) => block.phase),
    ["apertura", "mini-input", "ciclo-activo", "aplicacion", "cierre"],
  );
});

test("no phase drops below a minute, even at 45", () => {
  const flow = buildLessonFlow({ ...base, minutes: 45 });

  for (const block of flow.blocks) assert.ok(block.minutes >= 1);
});

test("the active cycle plus the application own most of the session", () => {
  const flow = buildLessonFlow(base);
  const active = flow.blocks
    .filter((block) => block.phase === "ciclo-activo" || block.phase === "aplicacion")
    .reduce((sum, block) => sum + block.minutes, 0);

  assert.ok(active / 90 > 0.55, `la práctica activa fue ${active}/90`);
});

test("the closing is scheduled, never leftovers of zero", () => {
  for (const minutes of CLASS_MINUTES) {
    const closing = buildLessonFlow({ ...base, minutes }).blocks.at(-1);
    assert.ok(closing && closing.minutes >= 3, `cierre de ${closing?.minutes} en ${minutes}`);
  }
});

test("a single class carries no prework; a weekly sequence does", () => {
  assert.equal(buildLessonFlow({ ...base, sequence: "unica" }).prework, null);
  assert.match(String(buildLessonFlow({ ...base, sequence: "semanal" }).prework), /Antes de la clase/);
});

test("the weekly sequence plans for re-exposure instead of a single shot", () => {
  assert.match(buildLessonFlow(base).transfer, /sesión 2 y 4/);
  assert.match(buildLessonFlow({ ...base, sequence: "unica" }).transfer, /tarea auténtica/);
});

test("the application task is written for the discipline", () => {
  const salud = buildLessonFlow({ ...base, discipline: "salud" }).blocks.find(
    (block) => block.phase === "aplicacion",
  );
  const derecho = buildLessonFlow({ ...base, discipline: "derecho" }).blocks.find(
    (block) => block.phase === "aplicacion",
  );

  assert.match(String(salud?.detail), /nota clínica/);
  assert.match(String(derecho?.detail), /cláusula/);
});

test("every discipline produces a distinct application task", () => {
  const details = DISCIPLINES.map((discipline) =>
    buildLessonFlow({ ...base, discipline }).blocks.find((block) => block.phase === "aplicacion")?.detail,
  );

  assert.equal(new Set(details).size, DISCIPLINES.length);
});

test("a complete design validates", () => {
  const result = validateClassDesign(base);

  assert.equal(result.ok, true);
  assert.deepEqual(result.design, base);
});

test("an incomplete design is refused with the exact missing field", () => {
  const missingMinutes = validateClassDesign({ ...base, minutes: 50 as never });
  const missingDiscipline = validateClassDesign({ ...base, discipline: undefined });
  const missingLevel = validateClassDesign({ ...base, educationLevel: undefined });

  assert.equal(missingMinutes.ok, false);
  assert.match(missingMinutes.errors.join(" "), /duración/);
  assert.match(missingDiscipline.errors.join(" "), /disciplina/);
  assert.match(missingLevel.errors.join(" "), /nivel educativo/);
});

test("the design summary is readable in one line", () => {
  assert.equal(describeDesign(base), "negocios · posgrado · 90 min · secuencia semanal");
});
