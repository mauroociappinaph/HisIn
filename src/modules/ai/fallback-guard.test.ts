import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/**
 * A guard on the one defect that cost the most time in this codebase.
 *
 * resolveModels returns an ordered chain, but every route once took its head with
 * `const [model] = resolveModels()`, so a single throttled provider ended the whole
 * generation. Fixing it in eight files is not a guarantee; this test is: no route may
 * call the engine with a model it picked itself.
 */
function routeFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      found.push(...routeFiles(path));
      continue;
    }
    if (path.endsWith("route.ts")) found.push(path);
  }
  return found;
}

const files = routeFiles("src/app/api");

test("there are route files to check", () => {
  assert.ok(files.length > 5, `found ${files.length} route files`);
});

test("no route picks a single model from the chain", () => {
  const offenders = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    return /const \[model\] = resolveModels\(\)/.test(source);
  });
  assert.deepEqual(offenders, [], "use runWithFallback instead of the first model");
});

test("no route calls the engine without the fallback, except the fallback itself", () => {
  const offenders = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    return /runGentleShell\(/.test(source);
  });
  assert.deepEqual(offenders, [], "routes must go through runWithFallback");
});
