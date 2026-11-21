import assert from "node:assert/strict";
import { test } from "node:test";
import { buildArgs, parseEventStream } from "./gentle-shell";

const assistantEvent = (text: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    type: "message_end",
    message: {
      role: "assistant",
      model: "gemini-free/gemini-3.1-flash-lite",
      content: [{ type: "text", text }],
      ...extra,
    },
  });

test("assistant text is extracted from the event stream", () => {
  const stdout = [
    JSON.stringify({ type: "session", version: 3 }),
    JSON.stringify({ type: "turn_start" }),
    assistantEvent('{"questions":[]}'),
  ].join("\n");

  const parsed = parseEventStream(stdout);

  assert.equal(parsed.text, '{"questions":[]}');
  assert.equal(parsed.model, "gemini-free/gemini-3.1-flash-lite");
  assert.equal(parsed.error, undefined);
});

test("ninety nine percent of the stream being noise does not matter", () => {
  const stdout = ["not json at all", "", "   ", assistantEvent("hello")].join("\n");

  assert.equal(parseEventStream(stdout).text, "hello");
});

test("user messages are never mistaken for the answer", () => {
  const stdout = [
    JSON.stringify({ type: "message_end", message: { role: "user", content: [{ type: "text", text: "prompt" }] } }),
  ].join("\n");

  assert.equal(parseEventStream(stdout).text, "");
});

test("the last assistant message wins", () => {
  const stdout = [assistantEvent("first"), assistantEvent("second")].join("\n");

  assert.equal(parseEventStream(stdout).text, "second");
});

test("a provider error is surfaced even when a reply was produced", () => {
  const stdout = assistantEvent("", { errorMessage: "403 permission_error oauth_not_allowed_for_organization" });

  const parsed = parseEventStream(stdout);

  assert.equal(parsed.error, "403 permission_error oauth_not_allowed_for_organization");
});

test("the child never inherits stdin and never gets interactive or tool flags", () => {
  const args = buildArgs({ prompt: "hello", model: "gemini-free/gemini-3.1-flash-lite" });

  assert.deepEqual(args.slice(0, 2), ["-p", "--mode"]);
  assert.ok(args.includes("--no-tools"));
  assert.ok(args.includes("--no-extensions"));
  assert.ok(args.includes("--no-mcp"));
  assert.ok(args.includes("--no-session"));
  assert.equal(args.includes("--continue"), false);
  assert.equal(args.at(-1), "hello");
});

test("the model and system prompt are passed explicitly", () => {
  const args = buildArgs({ prompt: "hello", system: "be terse", model: "openai-codex/gpt-5.6-luna" });

  const modelIndex = args.indexOf("--model");
  assert.equal(args[modelIndex + 1], "openai-codex/gpt-5.6-luna");
  const systemIndex = args.indexOf("--append-system-prompt");
  assert.equal(args[systemIndex + 1], "be terse");
});
