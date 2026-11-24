import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LESSON_SECTIONS,
  canonicalizeLessonContent,
  isCompleteLessonContent,
  parseLessonContent,
} from "./structure";

const canonical = [
  "Goal: Report status without saying when it happened.",
  "Learn: present perfect, passive voice.",
  'Examples: "We have launched the app." / "The report was approved."',
  "Practice: Turn three updates from your week into present perfect sentences.",
  'Common mistake: "We have launched it yesterday" mixes two times.',
].join("\n\n");

test("canonical content parses into the five sections in order", () => {
  const sections = parseLessonContent(canonical);

  assert.deepEqual(
    sections.map((section) => section.key),
    LESSON_SECTIONS.map((section) => section.key),
  );
  assert.equal(sections[0]?.body, "Report status without saying when it happened.");
  assert.equal(sections[0]?.label, "Objetivo");
});

test("legacy prose is read through the labels it already uses", () => {
  const legacy = [
    "Learn: patient, doctor, hospital.",
    "Example: 'The patient is sick.'",
    "Practice using these words in simple sentences.",
  ].join("\n\n");

  const sections = parseLessonContent(legacy);

  assert.deepEqual(
    sections.map((section) => section.key),
    ["learn", "examples"],
  );
  assert.match(sections[1]?.body ?? "", /docs?|Practice using these words/);
});

test("content with no recognisable section is not parsed", () => {
  assert.deepEqual(parseLessonContent("FHIR = Fast Healthcare Interoperability Resources."), []);
  assert.deepEqual(parseLessonContent("   "), []);
});

test("canonicalizing is idempotent", () => {
  const once = canonicalizeLessonContent(canonical);

  assert.equal(once, canonical);
  assert.equal(canonicalizeLessonContent(once), once);
});

test("canonicalizing puts shuffled sections back in order", () => {
  const shuffled = [
    "Practice: Write three sentences.",
    "Goal: Describe a patient.",
    "Common mistake: never say 'the patient is bad'.",
  ].join("\n\n");

  const normalized = canonicalizeLessonContent(shuffled);

  assert.ok(normalized.indexOf("Goal:") < normalized.indexOf("Practice:"));
  assert.ok(normalized.indexOf("Practice:") < normalized.indexOf("Common mistake:"));
});

test("canonicalizing never deletes content it cannot understand", () => {
  const raw = "  FHIR = a data standard.\nHIPAA = a privacy law.  ";

  assert.equal(canonicalizeLessonContent(raw), "FHIR = a data standard.\nHIPAA = a privacy law.");
});

test("completeness needs every section", () => {
  assert.equal(isCompleteLessonContent(canonical), true);
  assert.equal(isCompleteLessonContent("Goal: only a goal here, nothing else at all."), false);
});
