import { spawn } from "node:child_process";
import { DEFAULT_MODEL, DEFAULT_TIMEOUT_MS } from "./models";

export { DEFAULT_MODEL, DEFAULT_TIMEOUT_MS };

/**
 * Gentle Shell is the only AI engine HisIn talks to.
 *
 * It runs headless through the local `pi` CLI, so the app needs no provider SDK
 * and no API key: the machine's existing Pi authentication is what pays for and
 * authorizes the call. Two facts about `pi -p` shape this adapter:
 *
 * 1. It reads stdin. A child that inherits stdin silently eats it, so stdin is
 *    always `ignore`.
 * 2. It exits 0 when the provider fails. Provider errors are therefore read
 *    from the JSON event stream (`errorMessage`), never from the exit code.
 */

export type GentleShellFailure = "spawn" | "timeout" | "provider" | "empty";

export class GentleShellError extends Error {
  constructor(
    message: string,
    readonly failure: GentleShellFailure,
  ) {
    super(message);
    this.name = "GentleShellError";
  }
}

export interface ParsedEventStream {
  text: string;
  model?: string;
  error?: string;
}

/** Extracts the last assistant reply and any provider error from pi's event stream. */
export function parseEventStream(stdout: string): ParsedEventStream {
  let model: string | undefined;
  let error: string | undefined;
  let text = "";

  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;

    let event: unknown;
    try {
      event = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof event !== "object" || event === null) continue;

    const record = event as { type?: unknown; message?: Record<string, unknown> };
    if (record.type !== "message_end") continue;

    const message = record.message;
    if (!message || message.role !== "assistant") continue;

    if (typeof message.model === "string") model = message.model;
    if (typeof message.errorMessage === "string" && message.errorMessage.trim()) {
      error = message.errorMessage.trim();
      continue;
    }

    const content = Array.isArray(message.content) ? message.content : [];
    const joined = content
      .filter((part): part is { type: string; text: string } => {
        return (
          typeof part === "object" &&
          part !== null &&
          (part as { type?: unknown }).type === "text" &&
          typeof (part as { text?: unknown }).text === "string"
        );
      })
      .map((part) => part.text)
      .join("")
      .trim();

    if (joined) text = joined;
  }

  return { text, model, error };
}

/** The exact CLI contract. Nothing here is user-controllable. */
export function buildArgs(options: { prompt: string; system?: string; model: string }): string[] {
  const args = [
    "-p",
    "--mode",
    "json",
    "--no-tools",
    "--no-extensions",
    "--no-mcp",
    "--no-session",
    "--model",
    options.model,
  ];
  if (options.system) args.push("--append-system-prompt", options.system);
  args.push(options.prompt);
  return args;
}

export interface RunGentleShellOptions {
  prompt: string;
  system?: string;
  model?: string;
  timeoutMs?: number;
  executable?: string;
}

export interface GentleShellResult {
  text: string;
  model: string;
  durationMs: number;
}

export async function runGentleShell(options: RunGentleShellOptions): Promise<GentleShellResult> {
  const model = options.model ?? process.env.AI_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const executable = options.executable ?? process.env.AI_CLI ?? "pi";
  const startedAt = Date.now();

  const child = spawn(/* turbopackIgnore: true */ executable, buildArgs({ prompt: options.prompt, system: options.system, model }), {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);

  let exitCode: number | null = null;
  try {
    exitCode = await new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) => resolve(code));
    });
  } catch (cause) {
    throw new GentleShellError(
      `could not start ${executable}: ${cause instanceof Error ? cause.message : String(cause)}`,
      "spawn",
    );
  } finally {
    clearTimeout(timer);
  }

  if (timedOut) {
    throw new GentleShellError(`gentle shell timed out after ${timeoutMs}ms`, "timeout");
  }

  const parsed = parseEventStream(stdout);
  if (parsed.error) {
    throw new GentleShellError(`provider error: ${parsed.error}`, "provider");
  }
  if (!parsed.text) {
    const detail = stderr.trim() || stdout.trim();
    throw new GentleShellError(
      `gentle shell returned no text (exit ${exitCode})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
      "empty",
    );
  }

  return { text: parsed.text, model: parsed.model ?? model, durationMs: Date.now() - startedAt };
}
