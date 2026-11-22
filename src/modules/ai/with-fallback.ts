import { runGentleShell, type GentleShellResult } from "./gentle-shell";
import { resolveModels, resolveTimeoutMs } from "./models";

/**
 * Runs a prompt against the model chain until one answers.
 *
 * `resolveModels` already returns an ordered, environment-overridable list, but
 * every caller was taking its head and dying on the first throttle: a 429 from the
 * free tier stopped the whole syllabus. This walks the chain, so one exhausted
 * provider is a delay instead of a failure.
 */
export async function runWithFallback(options: {
  prompt: string;
  system?: string;
  timeoutMs?: number;
}): Promise<GentleShellResult & { model: string }> {
  const models = resolveModels();
  let lastError: unknown = null;

  const base = options.timeoutMs ?? resolveTimeoutMs() * 2;

  for (const [index, model] of models.entries()) {
    try {
      // The first model gets the full budget; the fallbacks get a shorter one, so a
      // throttled provider costs a delay instead of the whole request budget.
      const result = await runGentleShell({
        prompt: options.prompt,
        system: options.system,
        timeoutMs: index === 0 ? base : Math.min(base, 45_000),
        model,
      });
      return { ...result, model };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`every model failed: ${models.join(", ")}`);
}
