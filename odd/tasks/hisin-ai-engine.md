# HisIn — Gentle Shell AI engine + pending fixes

Feature: make HisIn generate its own learning content through Gentle Shell (headless `pi`), and close the pending correctness gaps.
Owner: mauroociappina · Branch: `feat/gentle-shell-ai-engine`

## Specs

S1. The app's AI engine is Gentle Shell invoked headless (`pi -p --mode json`). No third-party LLM SDK is added to `package.json`; only one adapter knows the CLI exists.

S2. Generated content is validated before persistence. A generation that fails, times out, or returns non-conforming JSON is recorded as a failed job and writes nothing to `Question`/`Vocabulary`.

S3. Provider failure detection reads the JSON event stream (`stopReason`, `errorMessage`), never the process exit code, because `pi -p` exits 0 on provider errors.

S4. The child process never inherits the parent's stdin (`stdio: ["ignore", ...]`), because `pi -p` consumes stdin silently.

S5. One Prisma client per process: `src/modules/vocabulary/srs.ts` uses `src/shared/db/prisma.ts` instead of instantiating its own.

S6. Vocabulary reviews reference a real `User` row. The hardcoded `"demo-user"` fallback is replaced by a persisted local identity resolved server-side.

S7. AI endpoints are not publicly triggerable: a request needs the `AI_SERVICE_TOKEN` service token, or development mode with `AI_ALLOW_LOCAL=1`.

S8. The repo has a real test harness (`pnpm test`) covering SM-2 scheduling, the Gentle Shell event parser, the generation schema and the endpoint guard.

S9. `README.md` documents setup, scripts, the AI engine contract, and the known gaps.

S10. Work lands as reviewable commits on a feature branch and is pushed.

S11. Provider resilience: generation tries candidate models in order (`AI_MODELS`, comma separated; defaults `AI_MODEL`, `gemini-free/gemini-3.1-flash-lite`, `nvidia-free/google/gemma-4-31b-it`, `openai-codex/gpt-5.6-luna`, deduplicated). Any recoverable failure (`provider`, `empty`, `timeout`) moves to the next candidate; a `spawn` failure does not retry, and the chain stops when `AI_MAX_TOTAL_MS` (default 120s) is spent. Per-attempt timeout defaults to 25s.

S12. `POST /api/ai/generate` answers immediately with `202 {jobId, status}` and the work continues in the same Node process. Only one generation runs per process: a second request while one is running gets `429 {error, jobId}` naming the running job.

S13. `GET /api/ai/jobs?limit=20` lists recent jobs newest first. `GET /api/ai/jobs/[id]` returns the job including its validated `output` when it succeeded.

S14. The engine generates three kinds: `question`, `vocabulary` and `lesson`. Each has its own zod schema, prompt and persistence target, and the same rule applies to all: nothing is written unless the model output validates.

S15. The seed is idempotent: re-running it never duplicates modules, questions, lessons or vocabulary. `pnpm db:reset-content` clears the content tables and reseeds; it never touches `GenerationJob` or `VocabularyReview`.

S16. `/studio` lets an operator generate content from the app: kind, level, skill, type, count and topic, a live job status while it runs, the produced items, and the list of recent jobs. It is linked from the main navigation.

S17. The studio is operator-only. It relies on the existing guard, so it works with `AI_ALLOW_LOCAL=1` on a trusted server or through the service token; the UI states this instead of pretending it is a public feature.

## Tasks

| ID | Spec | Route | Commit |
| --- | --- | --- | --- |
| T1 | S5, S6 | inline | fix: single prisma client and persisted local user |
| T2 | S1-S4, S7 | inline | feat: gentle shell content generation engine |
| T3 | S8 | inline | test: cover srs scheduling, event parser, schema and guard |
| T4 | S9 | inline | docs: real project README and AI engine contract |
| T5 | S10 | inline | push feature branch |
| T6 | S11, S12, S13 | gentle-ai-worker | fix: provider fallback chain and asynchronous generation jobs |
| T7 | S14 | gentle-ai-worker | feat: generate vocabulary and lessons, not only questions |
| T8 | S15 | gentle-ai-worker | fix: idempotent seed and content reset script |
| T9 | S16, S17 | gentle-ai-worker | feat: studio page to generate content from the app |

## Log

L1 (verbatim): "Quiero que esa app use gentle-ai por detras"
L2 (verbatim): "Quiero que la app use en hackground gentle ai."
L3 (verbatim): "Gentle sheel que usse"
L4 (verbatim): "Arregla todo y hace el add commit y push"

L5 evidence: `pi -p` smoke test returned `403 permission_error oauth_not_allowed_for_organization` for `anthropic/claude-opus-4-8` while exiting 0. Provider probe over 13 configured providers: working = `gemini-free`, `itera-free`, `nvidia-free`, `openai-codex`; failing = anthropic (403), deepseek (401), kaggle-ollama (connection), kilo-free (404), minimax (402), nvidia (410), opencode (429), openrouter (402).
L6 decision: default adapter model is `gemini-free/gemini-3.1-flash-lite`, overridable with `AI_MODEL`. No API key is added; the CLI uses the machine's Pi auth.
L7 evidence: `npx prisma migrate status` failed with `Environment variable not found: DATABASE_URL` — `local.env` is not loaded by Next.js or the Prisma CLI. Migration `20261116202557_add_srs` is therefore unverified against the database.
L8 decision: `next.config.ts` loads `local.env` (and `.env.local` when present) into `process.env`, so the existing file keeps working without duplicating the secret.

L9 evidence: end-to-end on the local Postgres database. `POST /api/ai/generate` returned `202 {jobId, status:"PENDING"}` for the first request and `429 {error, jobId}` naming the same running job for a simultaneous second request, so the single-flight guard works. A `vocabulary` job succeeded with `createdCount: 2`. A `question` job failed with `gemini-free/gemini-3.1-flash-lite: gentle shell timed out after 45000ms`, and because S11 then said a timeout ends the chain, no fallback provider was ever tried.

L10 decision (spec correction): L9 proved the original timeout rule wrong. A provider that stalls is exactly when a fallback is worth trying, so the chain now advances on `timeout` as well and bounds the work with `AI_MAX_TOTAL_MS` instead. Per-attempt timeout lowered to 25s, total budget 120s, and the decision is extracted into `src/modules/ai/policy.ts` so it is testable without spawning.

L11 evidence: the seed is idempotent. After clearing content, two consecutive seed runs produced identical counts (72 questions, 10 lessons, 14 vocabulary, 6 modules) and removed the historical duplicates (previously 113 questions, 20 lessons, 28 vocabulary).

L12 evidence: no writer subagent could start in this environment (`Writer repository preparation was unavailable`), so T6-T9 were implemented inline by the parent instead of delegated. Reported as a fallback, not as delegation.

L13 decision: generated vocabulary and lessons are constrained to the real module slugs (`CONTENT_MODULES`), and every insert is deduplicated against its natural key, so the engine cannot write rows no page can show or silently double the bank.

## Slices

Branch `feat/gentle-shell-ai-engine`. The first delivery (`5d81645..7207c83`) is 1998 authored lines in seven slices: schema and env loading, SRS review, the Gentle Shell engine, question types, tests, lint compliance, docs.

The VTO increment is four smaller slices: `9b2c394` engine (~610 lines, includes `package.json`), `db0ee8e` studio (~380), `bd9f945` CLI and idempotent seed (~140), `7b6ae0c` docs. One sequencing blemish: `9b2c394` adds the `ai:generate` script in `package.json` one slice before `scripts/generate.ts` lands in `bd9f945`, so that single intermediate commit references a file it does not yet contain. The final tree is correct and every slice types, lints and builds.
