import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Loads optional local env files into process.env.
 *
 * `local.env` is the file this repository already uses; `.env.local` is the
 * Next.js convention. Real environment variables always win, so CI and hosted
 * deployments are unaffected. Values are never logged.
 *
 * Shared by next.config.ts, the Prisma seed and the content reset script so the
 * three agree on where the database URL comes from.
 */
export function loadLocalEnv(cwd: string = process.cwd()): void {
  for (const file of ["local.env", ".env.local"]) {
    const path = join(cwd, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}
