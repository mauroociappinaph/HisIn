import { buildEntryPrompt, parseEntryAnalysis, type EntryAnalysis, type EntryAnalysisResult } from "./analysis";
import type { EntryKind } from "./entry";

/** Runs the engine once with a prompt and returns its raw reply. */
export type EntryRunner = (prompt: string) => Promise<string>;

export interface AnalyzeOutcome {
  ok: boolean;
  attempts: number;
  analysis?: EntryAnalysis;
  kind?: EntryKind;
  /** The last rejection reason, when every attempt failed. */
  error?: string;
}

/**
 * One field in, one valid entry out — with one repair attempt.
 *
 * The first reply is often structurally fine but wrong in the one place that
 * matters: a two-word fragment returned as a PATTERN ("interested in" instead of
 * "be interested in + noun/gerund"). Rejecting it and asking the learner to
 * reformulate is a bad trade, so the exact rejection reason is fed back to the
 * model once. Bounded on purpose: one repair, never a loop.
 */
export async function analyzeEntry(
  input: string,
  run: EntryRunner,
  maxAttempts = 2,
  context?: string,
): Promise<AnalyzeOutcome> {
  let reason: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let raw: string;
    try {
      raw = await run(buildEntryPrompt(input, reason, context));
    } catch (error) {
      return {
        ok: false,
        attempts: attempt,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    const parsed: EntryAnalysisResult = parseEntryAnalysis(raw);
    if (parsed.ok) {
      return { ok: true, attempts: attempt, analysis: parsed.analysis, kind: parsed.kind };
    }
    reason = parsed.error;
  }

  return { ok: false, attempts: maxAttempts, error: reason ?? "no pudimos analizar la entrada" };
}
