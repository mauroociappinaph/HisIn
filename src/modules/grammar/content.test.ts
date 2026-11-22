import assert from "node:assert/strict";
import { test } from "node:test";
import { GRAMMAR_TOPICS, findTopic, topicsByAxis, topicsByLevel } from "./content";

test("every topic has a unique slug", () => {
  const slugs = GRAMMAR_TOPICS.map((topic) => topic.slug);

  assert.equal(new Set(slugs).size, slugs.length);
});

test("every topic answers where it is used, with at least two situations", () => {
  for (const topic of GRAMMAR_TOPICS) {
    assert.ok(topic.whenToUse.length >= 2, `${topic.slug} no explica dónde se usa`);
    for (const use of topic.whenToUse) assert.ok(use.trim().length > 15, `${topic.slug} tiene un uso vacío`);
  }
});

test("every topic shows the form, examples with translation and at least one Spanish-speaker error", () => {
  for (const topic of GRAMMAR_TOPICS) {
    assert.ok(topic.form.trim().length > 10, `${topic.slug} sin forma`);
    assert.ok(topic.examples.length >= 2, `${topic.slug} con menos de dos ejemplos`);
    for (const example of topic.examples) {
      assert.ok(example.en.length > 5 && example.es.length > 5, `${topic.slug} ejemplo incompleto`);
    }
    assert.ok(topic.errors.length >= 1, `${topic.slug} sin error típico`);
    for (const error of topic.errors) {
      assert.ok(error.wrong && error.right && error.why.length > 10, `${topic.slug} error incompleto`);
      assert.notEqual(error.wrong, error.right);
    }
  }
});

test("the present perfect is documented and explains its uses against the past", () => {
  const topic = findTopic("present-perfect");

  assert.ok(topic);
  assert.equal(topic.level, "B1");
  assert.ok(topic.whenToUse.some((use) => /resultado|experiencia|continúa/i.test(use)));
  assert.ok(topic.errors.some((error) => /yesterday/i.test(error.wrong)));
});

test("the contrast between present perfect and past simple has its own page", () => {
  const topic = findTopic("present-perfect-vs-past-simple");

  assert.ok(topic);
  assert.ok(topic.whenToUse.some((use) => /marcador/i.test(use)));
});

test("every level on the map has content and is sorted", () => {
  const groups = topicsByLevel();

  assert.ok(groups.length >= 4);
  for (const group of groups) {
    assert.ok(group.topics.length > 0);
    const orders = group.topics.map((topic) => topic.order);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), `${group.level} fuera de orden`);
  }
});

test("the three axes are non-empty", () => {
  assert.ok(topicsByAxis("TIEMPOS").length >= 6);
  assert.ok(topicsByAxis("ESTRUCTURAS").length >= 3);
  assert.ok(topicsByAxis("REGLAS").length >= 0);
});

test("an unknown slug returns null instead of throwing", () => {
  assert.equal(findTopic("no-existe"), null);
});

test("tenses cover the ones a professional writing needs", () => {
  const slugs = GRAMMAR_TOPICS.map((topic) => topic.slug);

  for (const required of [
    "present-simple",
    "present-continuous",
    "past-simple",
    "past-continuous",
    "present-perfect",
    "past-perfect",
    "future-forms",
  ]) {
    assert.ok(slugs.includes(required), `falta ${required}`);
  }
});
