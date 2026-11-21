/**
 * Generates content headlessly, without a running server.
 *
 * Usage:
 *   pnpm ai:generate --kind question --level B2 --skill BUSINESS \
 *     --type MULTIPLE_CHOICE --count 3 --topic "investor updates"
 *
 * Exit code 0 on success, 1 on any failure, so cron and CI can react.
 */
import { loadLocalEnv } from "../src/shared/lib/load-env";

loadLocalEnv();

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * The engine modules are imported dynamically on purpose: the env file must be
 * loaded before the Prisma client is constructed, and a static import would be
 * hoisted above `loadLocalEnv()`. The dynamic imports live inside `main` rather
 * than at top level because this package compiles to CJS, where top-level await
 * is not supported.
 */
async function main(): Promise<void> {
  const { generationRequestSchema } = await import("../src/modules/ai/schema");
  const { generateNow } = await import("../src/modules/ai/service");

  const parsed = generationRequestSchema.safeParse({
    kind: arg("kind") ?? "question",
    level: arg("level") ?? "B1",
    skill: arg("skill"),
    type: arg("type"),
    count: Number(arg("count") ?? "3"),
    topic: arg("topic"),
  });

  if (!parsed.success) {
    console.error("invalid arguments:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".") || "root"}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const request = parsed.data;
  console.log(
    `generating ${request.count} ${request.kind} item(s) at ${request.level}` +
      (request.topic ? ` about "${request.topic}"` : ""),
  );

  const outcome = await generateNow(request);
  console.log(JSON.stringify(outcome, null, 2));
  process.exitCode = outcome.status === "SUCCEEDED" ? 0 : 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
