import { z } from "zod";
import { CEFR_LEVELS } from "@/modules/ai/schema";
import { usesInflectedTerm } from "@/shared/lib/text";

/**
 * What Gentle Shell must return for one article.
 *
 * Everything is anchored to the text: a vocabulary example that does not use its
 * own term is useless as a card, so it is refused rather than saved.
 */
export const newsAnalysisSchema = z
  .object({
    /** English summary: this app teaches English, the digest is practice too. */
    summary: z.string().min(20).max(600),
    level: z.enum(CEFR_LEVELS),
    vocabulary: z
      .array(
        z.object({
          term: z.string().min(2).max(60),
          definition: z.string().min(10).max(400),
          example: z.string().min(10).max(400),
        }),
      )
      .min(3)
      .max(8),
    patterns: z
      .array(
        z.object({
          frame: z.string().min(4).max(80),
          function: z.enum(["hedge", "soften", "persuade", "report", "compare"]),
          example: z.string().min(10).max(400),
          commonError: z.string().min(10).max(300),
        }),
      )
      .min(1)
      .max(4),
  })
  .superRefine((analysis, ctx) => {
    for (const entry of analysis.vocabulary) {
      if (!usesInflectedTerm(entry.example, entry.term)) {
        ctx.addIssue({
          code: "custom",
          path: ["vocabulary"],
          message: `the example for "${entry.term}" must use the term`,
        });
      }
    }
    for (const pattern of analysis.patterns) {
      if (!pattern.frame.includes("+") && pattern.frame.trim().split(/\s+/).length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["patterns"],
          message: `the pattern "${pattern.frame}" needs slots, for example "make + object + verb"`,
        });
      }
    }
  });

export type NewsAnalysis = z.infer<typeof newsAnalysisSchema>;

export const NEWS_SYSTEM_PROMPT = [
  "You are an English teacher for Spanish-speaking healthtech founders and entrepreneurs.",
  "You read a real news article and extract what a B2-C1 learner should notice.",
  "Write the summary in English, as a short digest the learner can read as practice.",
  "Write every vocabulary definition and example in English.",
  "Return ONLY a JSON object. No prose, no markdown fences, no comments.",
].join(" ");

/** Builds the analysis prompt for one article. */
export function buildNewsPrompt(article: { title: string; source: string; excerpt: string }): string {
  return [
    `Article title: ${JSON.stringify(article.title)}`,
    `Source: ${JSON.stringify(article.source)}`,
    `Text: ${JSON.stringify(article.excerpt.slice(0, 1400))}`,
    'Return this shape: {"summary","level","vocabulary":[{"term","definition","example"}],"patterns":[{"frame","function","example","commonError"}]}.',
    'level is the CEFR level of the article itself (usually B2 or C1).',
    "vocabulary: 3 to 8 domain terms the learner would not know, each with a one-sentence English definition and an example copied or adapted from the article that uses the exact term.",
    'patterns: 1 to 4 sentence structures the article uses that transfer to the learner\'s own writing. "function" must be exactly one of: "hedge", "soften", "persuade", "report", "compare". frame uses slots with +, e.g. "is expected to + verb".',
    "commonError: the mistake a Spanish speaker makes with that pattern, in Spanish.",
  ].join(" ");
}

/** Parses and validates the model's reply; throws with the exact reason. */
export function parseNewsAnalysis(raw: string): NewsAnalysis {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("model response did not contain a JSON object");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("model response was not valid JSON");
  }

  const result = newsAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`model response failed validation: ${issues}`);
  }
  return result.data;
}
