import { GentleShellError, runGentleShell } from "./gentle-shell";
import { resolveMaxTotalMs, resolveModels, resolveTimeoutMs } from "./models";
import { shouldTryNextModel, type Failure } from "./policy";
import { buildPrompt, SYSTEM_PROMPT } from "./prompt";
import { claimSlot, releaseSlot, runningJob } from "./queue";
import {
  createJob,
  markFailed,
  markRunning,
  markSucceeded,
  persistContent,
} from "./repository";
import type { GenerationKind, GenerationRequest } from "./schema";
import {
  parseGeneratedBatch,
  parseGeneratedLessons,
  parseGeneratedVocabulary,
} from "./schema";

function parseByKind(kind: GenerationKind, raw: string): unknown[] {
  switch (kind) {
    case "vocabulary":
      return parseGeneratedVocabulary(raw);
    case "lesson":
      return parseGeneratedLessons(raw);
    default:
      return parseGeneratedBatch(raw);
  }
}

/**
 * Runs one generation through the model chain.
 *
 * A provider or empty reply advances to the next candidate; a timeout stops the
 * chain so total wall clock stays bounded. The job records which model actually
 * produced the content.
 */
export interface JobOutcome {
  status: "SUCCEEDED" | "FAILED";
  model: string;
  createdCount: number;
  error: string | null;
}

async function processJob(jobId: string, request: GenerationRequest): Promise<JobOutcome> {
  const prompt = buildPrompt(request);
  const models = resolveModels();
  const timeoutMs = resolveTimeoutMs();
  const totalBudgetMs = resolveMaxTotalMs();
  const startedAt = Date.now();
  const failures: string[] = [];
  let lastModel = models[0] ?? "";

  try {
    for (const model of models) {
      lastModel = model;
      try {
        await markRunning(jobId, model);
        const response = await runGentleShell({
          prompt,
          system: SYSTEM_PROMPT,
          model,
          timeoutMs,
        });

        const items = parseByKind(request.kind, response.text);
        const createdCount = await persistContent(request.kind, items as never);
        await markSucceeded({
          id: jobId,
          model: response.model,
          output: items,
          createdCount,
        });
        return {
          status: "SUCCEEDED",
          model: response.model,
          createdCount,
          error: null,
        };
      } catch (error) {
        failures.push(`${model}: ${error instanceof Error ? error.message : String(error)}`);
        const failure: Failure = error instanceof GentleShellError ? error.failure : "provider";
        if (!shouldTryNextModel({ failure, elapsedMs: Date.now() - startedAt, totalBudgetMs })) {
          break;
        }
      }
    }

    const error = failures.join(" | ") || "no model produced content";
    await markFailed(jobId, error);
    return { status: "FAILED", model: lastModel, createdCount: 0, error };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markFailed(jobId, message).catch(() => undefined);
    return { status: "FAILED", model: lastModel, createdCount: 0, error: message };
  } finally {
    releaseSlot(jobId);
  }
}

export type StartOutcome =
  | { accepted: true; jobId: string; model: string }
  | { accepted: false; runningJobId: string };

/** Claims the single slot and starts the work without blocking the response. */
export async function startGeneration(request: GenerationRequest): Promise<StartOutcome> {
  const [model] = resolveModels();
  const job = await createJob({ request, prompt: buildPrompt(request), model });

  if (!claimSlot(job.id)) {
    const running = runningJob();
    await markFailed(job.id, "not started: another generation is already running").catch(
      () => undefined,
    );
    return { accepted: false, runningJobId: running?.jobId ?? "unknown" };
  }

  void processJob(job.id, request);
  return { accepted: true, jobId: job.id, model };
}

/**
 * Runs a generation and waits for it, for headless callers (CLI, cron, CI).
 * The HTTP route deliberately does the opposite: accept and return.
 */
export async function generateNow(request: GenerationRequest): Promise<JobOutcome & { jobId: string }> {
  const [model] = resolveModels();
  const job = await createJob({ request, prompt: buildPrompt(request), model });

  if (!claimSlot(job.id)) {
    const running = runningJob();
    throw new Error(`another generation is already running (${running?.jobId ?? "unknown"})`);
  }

  const outcome = await processJob(job.id, request);
  return { ...outcome, jobId: job.id };
}

/** Serialized view of a job, including the validated output when it succeeded. */
export function toJobPayload(job: {
  id: string;
  kind: string;
  status: string;
  model: string;
  createdCount: number;
  error: string | null;
  output: unknown;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    model: job.model,
    createdCount: job.createdCount,
    error: job.error,
    output: job.output,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
  };
}
