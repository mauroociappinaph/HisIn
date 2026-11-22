import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractExamples,
  extractFormula,
  findTrap,
  pairCorrection,
  objectivesFor,
  parseLesson,
  readingMinutes,
  splitParagraphs,
  timelineFor,
  wordCount,
} from "./lesson";

const gramar = [
  "In English we use the past simple for a finished event. It answers when it happened.",
  "Use 'did' for questions and negatives: 'Did the FDA approve the trial?'. Never conjugate after did: 'Did you go?' is right, 'Did you went?' is not.",
  "A common mistake among Spanish speakers is translating the present perfect literally: 'I have finished yesterday' instead of 'I finished yesterday'.",
].join("\n\n");

test("splitParagraphs drops empty paragraphs", () => {
  assert.deepEqual(splitParagraphs("One.\n\n\n\nTwo.\n\n"), ["One.", "Two."]);
});

test("extractExamples keeps quoted sentences and drops single-word labels", () => {
  const examples = extractExamples("Use 'did' for questions: 'Did the FDA approve the trial?' and 'go'.");
  assert.deepEqual(examples, ["Did the FDA approve the trial?"]);
});

test("extractExamples does not repeat the same example twice", () => {
  const examples = extractExamples("'Did you go?' then again 'did you go?' and 'Did you went?'");
  assert.equal(examples.length, 2);
});

test("findTrap finds the sentence naming the Spanish-speaker error", () => {
  const trap = findTrap(gramar);
  assert.ok(trap?.includes("Spanish speakers"));
  assert.ok(trap?.includes("I finished yesterday"));
});

test("findTrap returns null when the material names no error", () => {
  assert.equal(findTrap("Use the past simple for finished events. It is common in reports."), null);
});

test("parseLesson takes the first paragraph as the idea and removes the trap from the body", () => {
  const lesson = parseLesson(gramar);
  assert.match(lesson.idea, /finished event/);
  assert.ok(lesson.trap);
  assert.equal(
    lesson.body.some((paragraph) => paragraph.includes("Spanish speakers")),
    false,
    "the trap must not be repeated in the body",
  );
});

test("parseLesson handles a material without a trap", () => {
  const lesson = parseLesson("The rule.\n\nAnother paragraph of detail here.");
  assert.equal(lesson.trap, null);
  assert.deepEqual(lesson.body, ["Another paragraph of detail here."]);
});

test("readingMinutes is at least one minute and grows with length", () => {
  assert.equal(readingMinutes("short text"), 1);
  const long = Array.from({ length: 600 }, () => "word").join(" ");
  assert.equal(readingMinutes(long), 3);
});

test("wordCount counts real words", () => {
  assert.equal(wordCount("  one two   three "), 3);
  assert.equal(wordCount(""), 0);
});

test("objectivesFor keeps at most four key points", () => {
  assert.equal(objectivesFor(["a", "b", "c", "d", "e"]).length, 4);
});

test("extractFormula takes the template the material already quotes", () => {
  const formula = extractFormula("Use 'having + past participle' for completed actions.", [
    "Use 'should have + past participle' to analyse decisions.",
  ]);
  assert.deepEqual(formula, ["should have", "past participle"]);
});

test("extractFormula ignores quotes that are not a template", () => {
  assert.deepEqual(extractFormula("Use 'Did you go?' and 'I went'.", []), []);
});

test("pairCorrection turns the trap sentence into a wrong/right pair", () => {
  const pair = pairCorrection(
    "Spanish speakers say 'I should improved' instead of 'I should have improved'.",
  );
  assert.deepEqual(pair, { wrong: "I should improved", right: "I should have improved" });
});

test("pairCorrection refuses a trap with fewer than two quoted examples", () => {
  assert.equal(pairCorrection("Spanish speakers forget the auxiliary 'have'."), null);
  assert.equal(pairCorrection(null), null);
});

test("timelineFor places a tense on the timeline", () => {
  assert.equal(timelineFor("Present perfect")?.span, "past-to-now");
  assert.equal(timelineFor("Past perfect simple")?.span, "past-point");
  assert.equal(timelineFor("Future plans and predictions")?.span, "now-forward");
  assert.equal(timelineFor("Second conditional")?.span, "hypothetical");
});

test("timelineFor draws nothing when the topic is not about time", () => {
  assert.equal(timelineFor("Collocations"), null);
  assert.equal(timelineFor("Crime, justice and rights"), null);
});

test("pairCorrection needs a contrast marker, not two correct sentences", () => {
  const trap =
    "In Silicon Valley you will use this constantly: 'Have you ever pitched to Sequoia?' or 'We have just received the FDA approval.'";
  assert.equal(pairCorrection(trap), null);
});

test("extractExamples drops the Spanish sentence quoted in a translation warning", () => {
  const examples = extractExamples(
    "A common error is to translate 'llego tres años trabajando' and also to write 'I have worked here for three years'.",
  );
  assert.deepEqual(examples, ["I have worked here for three years"]);
});
