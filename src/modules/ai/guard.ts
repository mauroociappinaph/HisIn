import { timingSafeEqual } from "node:crypto";

function equals(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Decides who may trigger generation.
 *
 * The endpoint spawns an authenticated agent, so it is never public. Either the
 * `AI_SERVICE_TOKEN` shared secret matches, or development mode is explicitly
 * opted in with `AI_ALLOW_LOCAL=1`. Production never falls through.
 */
export function isAuthorized(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const expected = env.AI_SERVICE_TOKEN;

  if (expected && expected.length > 0) {
    const provided = headers.get("x-service-token") ?? "";
    return provided.length > 0 && equals(provided, expected);
  }

  return env.NODE_ENV !== "production" && env.AI_ALLOW_LOCAL === "1";
}
