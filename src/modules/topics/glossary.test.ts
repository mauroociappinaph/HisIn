import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GLOSSARY_SYSTEM_PROMPT,
  buildGlossaryPrompt,
  buildLookup,
  isWordToken,
  parseGlossary,
  tokenizeStory,
  type GlossEntry,
} from "./glossary";

const entries: GlossEntry[] = [
  { term: "scrappy", translation: "improvisado pero eficaz", kind: "word" },
  { term: "run into", translation: "toparse con", kind: "phrasal_verb" },
  { term: "put up with", translation: "aguantar", kind: "phrasal_verb", note: "formal: tolerate" },
  { term: "used to", translation: "solía", kind: "pattern" },
];

const filler = Array.from({ length: 8 }, (_, index) => ({
  term: `word${index}`,
  translation: `palabra${index}`,
  kind: "word",
}));

test("parseGlossary drops a repeated term so it cannot render twice", () => {
  const raw = JSON.stringify({
    entries: [
      { term: "scrappy", translation: "improvisado", kind: "word" },
      { term: "Scrappy", translation: "otra", kind: "word" },
      ...filler,
    ],
  });
  const glossary = parseGlossary(raw);
  assert.equal(glossary.entries.filter((entry) => entry.term.toLowerCase() === "scrappy").length, 1);
});

test("parseGlossary rejects a reply with too few entries", () => {
  const raw = JSON.stringify({ entries: [{ term: "scrappy", translation: "improvisado", kind: "word" }] });
  assert.throws(() => parseGlossary(raw), /validación/);
});

test("parseGlossary strips the story's punctuation from a term", () => {
  const raw = JSON.stringify({
    entries: [
      { term: "until dawn.", translation: "hasta el amanecer", kind: "word" },
      { term: "scrappy,", translation: "improvisado", kind: "word" },
      ...filler,
    ],
  });
  const glossary = parseGlossary(raw);
  assert.equal(glossary.entries.find((entry) => entry.translation === "hasta el amanecer")?.term, "until dawn");
  assert.equal(glossary.entries.find((entry) => entry.translation === "improvisado")?.term, "scrappy");
});

test("parseGlossary rejects an unknown kind", () => {
  const raw = JSON.stringify({
    entries: Array.from({ length: 9 }, (_, index) => ({
      term: `w${index}`,
      translation: `t${index}`,
      kind: "adjective",
    })),
  });
  assert.throws(() => parseGlossary(raw), /validación/);
});

test("tokenizeStory joins a multi-word unit written exactly as glossed", () => {
  const lookup = buildLookup(entries);
  const tokens = tokenizeStory("We had to put up with it and it worked.", lookup);
  const phrase = tokens.find((token) => token.entry?.term === "put up with");
  assert.equal(phrase?.text, "put up with");
});

test("tokenizeStory does not invent a match for an inflected form", () => {
  const lookup = buildLookup(entries);
  const tokens = tokenizeStory("They ran into a scrappy team.", lookup);
  assert.equal(tokens.find((token) => token.entry?.term === "run into"), undefined);
  assert.equal(tokens.find((token) => token.entry?.term === "scrappy")?.text, "scrappy");
});

test("tokenizeStory prefers the longest unit over its first word", () => {
  const lookup = buildLookup([...entries, { term: "put", translation: "poner", kind: "word" }]);
  const tokens = tokenizeStory("put up with", lookup);
  assert.equal(tokens.length, 1);
  assert.equal(tokens[0].entry?.term, "put up with");
});

test("tokenizeStory keeps punctuation and spacing intact", () => {
  const lookup = buildLookup(entries);
  const body = "Hello, scrappy world.";
  assert.equal(tokenizeStory(body, lookup).map((token) => token.text).join(""), body);
});

test("tokenizeStory leaves unglossed words as plain tokens", () => {
  const lookup = buildLookup(entries);
  const tokens = tokenizeStory("The board met", lookup);
  assert.equal(tokens.filter((token) => token.entry).length, 0);
});

test("buildLookup orders phrases longest first and caps the search", () => {
  const lookup = buildLookup([...entries, { term: "a b c d e f g", translation: "larga", kind: "pattern" }]);
  assert.equal(lookup.phrases[0].words, 7);
  assert.equal(lookup.maxWords, 5);
});

test("isWordToken ignores whitespace and bare punctuation", () => {
  assert.equal(isWordToken({ text: "  " }), false);
  assert.equal(isWordToken({ text: "—" }), false);
  assert.equal(isWordToken({ text: "scrappy," }), true);
});

test("buildGlossaryPrompt asks for multi-word units as written in the story", () => {
  const prompt = buildGlossaryPrompt({
    title: "The Last Sprint",
    body: "Elena ran into a scrappy team.",
    level: "B1",
  });
  assert.match(prompt, /phrasal_verb/);
  assert.match(prompt, /inflected form as written/);
  assert.match(prompt, /The Last Sprint/);
});

test("the system prompt keeps a multi-word unit in one entry", () => {
  assert.match(GLOSSARY_SYSTEM_PROMPT, /never split into separate words/);
  assert.match(GLOSSARY_SYSTEM_PROMPT, /Spanish from Argentina/);
});
