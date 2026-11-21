/**
 * Failure policy for the model chain.
 *
 * Extracted so the decision is testable without spawning anything.
 *
 * Observed in this environment: a free provider can stall past the per-attempt
 * timeout while a healthy provider sits one slot away. Deciding "timeout stops
 * the chain" therefore meant one slow provider could kill a generation. The
 * chain now advances on any recoverable failure and stops only when the total
 * budget is spent, so wall clock stays bounded without wasting the fallbacks.
 */

export type Failure = "spawn" | "timeout" | "provider" | "empty";

export interface AdvanceDecision {
  failure: Failure;
  elapsedMs: number;
  totalBudgetMs: number;
}

/** A missing executable is not worth retrying; everything else is. */
export function shouldTryNextModel(decision: AdvanceDecision): boolean {
  if (decision.failure === "spawn") return false;
  return decision.elapsedMs < decision.totalBudgetMs;
}
