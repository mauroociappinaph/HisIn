import { z } from "zod";
import { normalise } from "./search";

/**
 * The second chance for a query the index cannot answer.
 *
 * Lexical search fails on the question a learner actually asks: "cómo pido
 * disculpas formales" has no word in common with the lesson that teaches it. So when
 * the first pass comes back thin, the engine is asked for English keywords and two
 * candidate lessons, and the search runs again with those. The answer is cached, so a
 * popular query costs one call ever, not one per keystroke.
 */
export const expansionSchema = z.object({
  keywords: z.array(z.string().trim().min(2).max(40)).min(2).max(8),
  topics: z.array(z.string().trim().min(2).max(120)).max(3).default([]),
});

export type Expansion = z.infer<typeof expansionSchema>;

export const EXPANSION_SYSTEM_PROMPT = [
  "You translate a learner's question into search terms for an English course.",
  "You never answer the question: you only say what to look for.",
  "Return ONLY a JSON object. No prose, no markdown fences.",
].join(" ");

export function buildExpansionPrompt(input: {
  query: string;
  topics: { slug: string; title: string }[];
}): string {
  const index = input.topics.map((topic) => `${topic.slug}=${topic.title}`).join("; ");
  return [
    `Question: ${JSON.stringify(input.query)}`,
    'Return {"keywords","topics"}.',
    "keywords: 3 to 6 English words or short phrases a lesson would contain: the grammar name, the skill, the domain term.",
    "topics: up to 3 slugs from the index below that most likely answer it, best first. Use only slugs that appear in the index.",
    `Index: ${index}`,
  ].join("\n");
}

export function parseExpansion(raw: string): Expansion {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("the reply had no JSON object");

  const parsed = expansionSchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`the expansion failed validation: ${issues}`);
  }
  return parsed.data;
}

/** Drops the slugs the course does not have, so a suggestion cannot become a 404. */
export function knownTopics(expansion: Expansion, slugs: readonly string[]): string[] {
  const known = new Set(slugs);
  return expansion.topics.filter((slug) => known.has(slug));
}

/** The cache key: the same question asked twice is the same question. */
export function expansionKey(query: string): string {
  // A hyphen is a separator here, not a character: "dis-culpas" and "dis culpas"
  // are the same question and must hit the same cache row.
  return normalise(query).replace(/-/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

/**
 * Only worth a model call when the first pass is thin or shallow.
 *
 * Few results means the words are not in the index; full coverage on none of them
 * means there is material but nothing that answers the whole question. Both cases
 * deserve a second pass.
 */
export function needsExpansion(hits: readonly { coverage?: number }[]): boolean {
  if (hits.length < 3) return true;
  const best = hits[0]?.coverage ?? 0;
  return best < 1;
}
