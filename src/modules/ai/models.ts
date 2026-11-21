/**
 * Model selection for Gentle Shell.
 *
 * Free providers throttle and spike, so a single attempt is not a strategy: one
 * provider returning 503 must not end the generation. The chain is explicit and
 * ordered, environment-overridable, and deduplicated without losing priority.
 */

export const DEFAULT_MODEL = "gemini-free/gemini-3.1-flash-lite";
export const DEFAULT_TIMEOUT_MS = 25_000;
export const DEFAULT_MAX_TOTAL_MS = 120_000;

/** Probed providers that answered without error in this environment. */
const BUILTIN_FALLBACKS = [
  "gemini-free/gemini-3.1-flash-lite",
  "nvidia-free/google/gemma-4-31b-it",
  "openai-codex/gpt-5.6-luna",
];

export function resolveModels(env: Record<string, string | undefined> = process.env): string[] {
  const explicit = env.AI_MODELS?.trim();
  const candidates = explicit
    ? explicit.split(",")
    : [env.AI_MODEL, ...BUILTIN_FALLBACKS];

  const seen = new Set<string>();
  const models: string[] = [];
  for (const candidate of candidates) {
    const model = candidate?.trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);
    models.push(model);
  }

  return models.length > 0 ? models : [DEFAULT_MODEL];
}

export function resolveTimeoutMs(env: Record<string, string | undefined> = process.env): number {
  const parsed = Number(env.AI_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : DEFAULT_TIMEOUT_MS;
}

export function resolveMaxTotalMs(env: Record<string, string | undefined> = process.env): number {
  const parsed = Number(env.AI_MAX_TOTAL_MS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : DEFAULT_MAX_TOTAL_MS;
}
