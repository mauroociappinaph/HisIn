import type { CefrLevel } from "@/shared/types";

/**
 * Two jobs the syllabus needed and did not have: stop repeating content, and make
 * difficulty climb instead of jumping.
 *
 * Similarity is measured on word shingles, which catches the real failure - the
 * same memo rewritten with two nouns changed - without needing an embedding model
 * or a network call.
 */

const LEVEL_BASE: Record<CefrLevel, number> = {
  A1: 10,
  A2: 25,
  B1: 45,
  B2: 62,
  C1: 80,
  C2: 95,
};

/** Words that carry no meaning for comparison. */
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "of", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "as", "by", "from", "so", "if",
  "not", "no", "do", "does", "did", "has", "have", "had", "will", "would", "can",
]);

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}

/** Overlapping word groups: "the team shipped the build" -> [team shipped the build]. */
export function shingles(text: string, size = 4): Set<string> {
  const words = normalize(text);
  if (words.length < size) return new Set(words.length > 0 ? [words.join(" ")] : []);
  const groups = new Set<string>();
  for (let index = 0; index <= words.length - size; index += 1) {
    groups.add(words.slice(index, index + size).join(" "));
  }
  return groups;
}

/**
 * How close two texts are, from 0 to 1.
 *
 * Blends word-group overlap with plain vocabulary overlap: on a short memo, two
 * changed nouns destroy enough four-word groups to look like a different text,
 * while the vocabulary still gives it away.
 */
export function textSimilarity(first: string, second: string): number {
  const groups = similarity(shingles(first, 3), shingles(second, 3));
  const words = similarity(shingles(first, 1), shingles(second, 1));
  // Vocabulary weighted double: a rewritten memo changes a few nouns and keeps
  // almost every word, which is exactly the failure being caught.
  return (groups + words * 2) / 3;
}

/** Jaccard over shingles: 0 is unrelated, 1 is the same text. */
export function similarity(first: Set<string>, second: Set<string>): number {
  if (first.size === 0 || second.size === 0) return 0;
  let shared = 0;
  for (const group of first) if (second.has(group)) shared += 1;
  return shared / (first.size + second.size - shared);
}

export interface DuplicateHit {
  skill: string;
  topicSlug: string;
  score: number;
}

/**
 * Materials of the same skill that say what the candidate already says.
 *
 * Same skill only: a reading and a story may legitimately share a scene, two
 * readings of the same course may not.
 */
export function findDuplicates(
  candidate: { skill: string; body: string },
  corpus: readonly { skill: string; body: string; topicSlug: string }[],
  threshold = 0.55,
): DuplicateHit[] {
  return corpus
    .filter((entry) => entry.skill === candidate.skill)
    .map((entry) => ({
      skill: entry.skill,
      topicSlug: entry.topicSlug,
      score: textSimilarity(candidate.body, entry.body),
    }))
    .filter((hit) => hit.score >= threshold)
    .sort((first, second) => second.score - first.score);
}

/** Repeated sentences inside one material: the same takeaway twice is noise. */
export function repeatedSentences(body: string, minWords = 6): string[] {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ""))
    .filter((sentence) => sentence.split(/\s+/).filter(Boolean).length >= minWords);

  const seen = new Map<string, number>();
  for (const sentence of sentences) seen.set(sentence, (seen.get(sentence) ?? 0) + 1);
  return [...seen.entries()].filter(([, count]) => count > 1).map(([sentence]) => sentence);
}

/**
 * Where a lesson sits on one 1-100 scale of difficulty.
 *
 * Level sets the floor, position inside the module adds the climb, and the module
 * order breaks ties so two B1 lessons in different modules are still ordered.
 */
export function difficultyScore(input: {
  level: CefrLevel;
  unitOrder: number;
  positionInModule: number;
  moduleSize: number;
}): number {
  const base = LEVEL_BASE[input.level] ?? 45;
  const withinModule = input.moduleSize > 1 ? (input.positionInModule - 1) / (input.moduleSize - 1) : 0;
  const climb = withinModule * 8;
  const globalTiebreak = Math.min(4, input.unitOrder / 12);
  return Math.max(1, Math.min(100, Math.round(base + climb + globalTiebreak)));
}

export interface ProgressableTopic {
  slug: string;
  level: CefrLevel;
  unitOrder: number;
  order: number;
  title: string;
}

/**
 * The next lesson to open: the easiest one not marked done.
 *
 * This is what makes the course climb instead of shuffle: the recommendation never
 * jumps to C2 while an A2 lesson is still open.
 */
export function nextLesson(
  topics: readonly ProgressableTopic[],
  doneSlugs: readonly string[],
): ProgressableTopic | null {
  const done = new Set(doneSlugs);
  const sized = new Map<number, number>();
  for (const topic of topics) sized.set(topic.unitOrder, (sized.get(topic.unitOrder) ?? 0) + 1);

  const scored = topics
    .map((topic) => {
      const inModule = topics.filter((entry) => entry.unitOrder === topic.unitOrder).sort((a, b) => a.order - b.order);
      const position = inModule.findIndex((entry) => entry.slug === topic.slug) + 1;
      return {
        topic,
        score: difficultyScore({
          level: topic.level,
          unitOrder: topic.unitOrder,
          positionInModule: position,
          moduleSize: sized.get(topic.unitOrder) ?? 1,
        }),
      };
    })
    .sort((first, second) => first.score - second.score);

  return scored.find((entry) => !done.has(entry.topic.slug))?.topic ?? null;
}
