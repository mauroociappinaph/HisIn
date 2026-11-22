import assert from "node:assert/strict";
import { test } from "node:test";
import {
  expand,
  groupHits,
  normalise,
  searchDocuments,
  tokenize,
  type SearchDocument,
} from "./search";

const documents: SearchDocument[] = [
  {
    id: "corporate-writing",
    kind: "topic",
    title: "Corporate writing",
    body: "Emails, memos and proposals with a professional tone. Apologise for a delay, ask for a decision, close with a clear request.",
    href: "/topics/corporate-writing",
  },
  {
    id: "present-simple-negative-questions",
    kind: "topic",
    title: "Present simple: negatives and questions",
    body: "Use do and does to build negatives and questions. I do have the data for the audit.",
    href: "/topics/present-simple-negative-questions",
  },
  {
    id: "blunder",
    kind: "word",
    title: "blunder",
    body: "metida de pata, error grave. He blundered in the investor call.",
    href: "/library?q=blunder",
  },
  {
    id: "mission-to-mars",
    kind: "news",
    title: "A mission to Mars",
    body: "The rocket reached orbit after a decade of funding trouble.",
    href: "/news",
  },
];

test("normalise strips accents and punctuation", () => {
  assert.equal(normalise("¿Cómo se dice «metida de pata»?"), "como se dice metida de pata");
});

test("tokenize drops stop words in Spanish and English", () => {
  assert.deepEqual(tokenize("how do I say the apology for the delay"), ["say", "apology", "delay"]);
});

test("expand adds the domain synonyms of a Spanish query", () => {
  const expanded = expand(["disculpa"]);
  assert.ok(expanded.includes("apology"));
  assert.ok(expanded.includes("apologise"));
});

test("expand reduces a plural and a gerund to their base", () => {
  assert.ok(expand(["questions"]).includes("question"));
  assert.ok(expand(["shipping"]).includes("ship"));
});

test("searchDocuments finds the lesson that explains the question", () => {
  const hits = searchDocuments("como pido disculpas en un email", documents);
  assert.equal(hits[0].document.id, "corporate-writing");
});

test("searchDocuments ranks a title match above a body mention", () => {
  const hits = searchDocuments("negatives", documents);
  assert.equal(hits[0].document.id, "present-simple-negative-questions");
});

test("searchDocuments finds a Spanish gloss in a term", () => {
  const hits = searchDocuments("metida de pata", documents);
  assert.equal(hits[0].document.id, "blunder");
});

test("searchDocuments returns nothing for an unrelated query", () => {
  assert.deepEqual(searchDocuments("kubernetes helm chart", documents), []);
});

test("searchDocuments respects the limit", () => {
  const many = Array.from({ length: 40 }, (_, index) => ({
    id: `t${index}`,
    kind: "topic" as const,
    title: `Apology lesson ${index}`,
    body: "apology apology apology",
    href: `/topics/t${index}`,
  }));
  assert.equal(searchDocuments("apology", many, 5).length, 5);
});

test("groupHits keeps the reading order and drops empty groups", () => {
  const pairs: SearchDocument[] = [
    { id: "w", kind: "word", title: "blunder", body: "metida de pata", href: "/library" },
    { id: "t", kind: "topic", title: "Blunder handling", body: "how to own a blunder", href: "/topics/x" },
  ];
  const groups = groupHits(searchDocuments("blunder", pairs));
  assert.deepEqual(groups.map((group) => group.kind), ["topic", "word"]);
});
