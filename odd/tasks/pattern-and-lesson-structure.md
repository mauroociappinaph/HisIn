# Pattern entry + uniform structure for patterns and lessons

Adds one pattern (the workplace thanks formula) with a full explanation of how and where to use it,
defines a single canonical structure for pattern entries, and normalizes every lesson to one section
template. Scope decided by the human: one pattern entry for the thanks formula, with "We handle
projects" as its second example, and all three structural goals (single template, normalize existing
lessons, apply the pattern structure to all patterns).

## Specs

S1. One pattern entry represents the politeness formula **"Thanks for Handling the research."**, not two
separate entries. Its second example is **"We handle projects."** — the same verb in a company-capability
sense.

S2. Every pattern entry exposes the same fixed section set, in this order: term → meaning → function
(why/when it is used) → register (formality) → first example → second example → typical mistake.
`/patterns`, `EntryForm`, `POST /api/vocabulary` and the analyze path must all carry the same field set.
Today `extraExample` exists in the Prisma model and in `VocabularyDTO` but is dropped by
`createEntrySchema`, never written, and never rendered.

S3. The new pattern must explain **how and where to use it**: meaning, function, register, two examples,
and the typical mistake. A pattern card that shows only term + definition + one example does not satisfy
S3.

S4. All lessons share one structure, in this fixed order: `Goal:` → `Learn:` → `Examples:` → `Practice:`
→ `Common mistake:`. Required:
   - one canonical section list defined once and imported everywhere (no copy in zod, prompts, seed
     literals, UI and parsers);
   - an idempotent canonicalizer (canonical input → identical output);
   - the lesson renderer shows labeled sections in that order instead of raw `whitespace-pre-wrap`;
   - AI lesson generation emits the same sections and its schema rejects output missing any of them.

S5. Every existing lesson — the 10 literal lessons and any AI-generated row — ends up in the S4
structure. Seeded lessons come from a single content module that the seed imports, so re-running the seed
never duplicates or un-structures a lesson.

S6. No structural duplication: for patterns and for lessons there is exactly one place that defines the
section order, the labels and the validation. Any other file reads from it.

S7. Existing behavior for the other vocabulary kinds is unchanged: `WORD`, `PHRASAL_VERB` and `IDIOM`
entries keep working through form, API and analyze exactly as before S2.

## Tasks

| ID | Specs | Route | Commit |
| --- | --- | --- | --- |
| T1 | S1, S2, S3, S7 | inline (delegation refused by runtime admission) | feat(patterns): canonical pattern sections and second example |
| T2 | S4, S5, S6 | inline | feat(lessons): one canonical lesson structure |
| T3 | S1, S5 | parent: seed wiring + data run | feat(content): seed thanks-for-handling pattern and canonical lessons |
| T4 | S1-S7 | inline checks: pnpm test, tsc, lint, differential, verifier | — |
| T5 | S5 | the 18 prose lessons moved into the seed | feat(lessons): rebuild every lesson from source |

### Evidence

- `pnpm test`: 333 tests, 333 pass (new: `patterns.test.ts`, `structure.test.ts`, `content.test.ts`, plus
  `extraExample` cases in `entry.test.ts` and the two lesson-schema cases in `ai/schema.test.ts`).
- `tsc --noEmit` and `pnpm lint`: clean.
- Differential (risk item 3): the HEAD test files for `entry`, `analysis`, `analyze`, `update`,
  `ai/prompt` and `ai/schema` run against the new source: 52 pass, 1 intentional divergence - the old
  lesson fixture that does not declare the five sections, which S4 now rejects.
- Data: `pnpm seed` writes the PATTERN row (`Thanks for handling + noun/gerund`, source SEED, function
  `soften`, register `neutral`, second example and typical mistake present) and the 10 canonical lessons.
  `pnpm db:normalize-lessons` is idempotent (second run rewrites 0 rows).
- Lessons: all 28 live in `src/modules/lessons/content.ts`. `pnpm seed` adopts each one by natural key
  (`module|level|title`), so a row that was generated before keeps its id and no duplicate appears: ids are
  identical before and after a seed run, `seed=28 db=28`, and every stored row equals its source entry
  (`identical=28`). The database holds nothing the source cannot rebuild.
- `db:normalize-lessons` is a dry run unless `--apply` is passed, so no script rewrites learner-facing rows
  by accident; on a seeded database it reports 0 pending changes.
- `pnpm backup:content` now snapshots lessons too (`lessons=28`) and `--restore` adopts them by natural key:
  restoring the fresh snapshot into the same database changed no id and no body.
- Commits on `feat/stories-interactive`: `ecfd7f6` (patterns), `75b6b1b` (lessons + content), `0633c97`
  (evidence doc), plus the risk-1 commit (seed adoption, gated normalize, backup coverage).
- Delivery shape: the branch already carries 37 commits and ~59k authored lines since `main`, far past one
  reviewable slice, so publishing needs chained PRs; these commits are one reviewable slice each.
- Declared boundary (named by verification): a lesson generated into the database by the studio or the AI
  pipeline (`src/modules/ai/repository.ts`) exists nowhere else until the next `pnpm backup:content`. The
  seed owns the 28 lessons the app ships; generated rows are owned by the backup, never by the seed.

## Log

L1. User's original request, verbatim:

> Hi, i have a ne pattron to add:
>
> We handle projects.
>
> Thanks for Handling the research.
>
> Look for where u can add this pattern whit all his explain how , where to use.
>
> Also you have to do for all lesson the same structure,

L2. Human decisions (verbatim answers): pattern entry = "Una entrada: fórmula de agradecimiento";
scope = "Las tres cosas" (single template + normalize existing lessons + apply the structure to all
patterns).

L3. Delegation attempt: two writers (T1, T2) with disjoint surfaces were refused by runtime admission
("a writer costs more tokens and time than this small unit"), so both tasks were implemented inline by
the parent. Surface contract kept as documented in each task.

L4. Term shape: `validateEntry` requires a PATTERN term to carry slots, so the seeded term is
`Thanks for handling + noun/gerund`; the human's sentence became the first example and the
`We handle projects` sentence became the second example.

L5. Function `soften` and register `neutral` were reused instead of adding an enum value: a new value
would need a migration and this request is about content and structure.

L6. The 18 AI-generated prose lessons found in the database could not be given the five sections without
authored content, so they were first left intact and listed by `db:normalize-lessons`.

L7. Human request, verbatim: "Resolve el Risk 1". Risk 1 was the normalize script rewriting stored lesson
content. Resolution chosen: make the data rebuildable instead of merely careful - all 28 lessons moved into
`src/modules/lessons/content.ts`, the seed adopts them by natural key (no duplicate, ids preserved),
`db:normalize-lessons` writes only with `--apply`, and `backup:content` now covers lessons. Verified:
`seed=28 db=28 identical=28`, unchanged ids after a seed run, 0 pending changes on a dry run, and an
idempotent restore.

L8. Independent verification (T4) reported three findings, all fixed in `a-fix commit`:
1. S2 blocker - `POST /api/vocabulary/analyze` rebuilt the repository payload by hand and dropped
   `extraExample`, so a saved analyzed entry lost its second example. Fixed by moving that object into
   `entryInputFromAnalysis()` in `analysis.ts`, where a test covers it, and calling it from the route.
2. An unrequested change to the `GET /api/vocabulary?kind=` error string was reverted to the baseline text,
   as was server-side trimming of `notes`; only `extraExample` is trimmed, because it is the new field.
3. `canonicalizeLessonContent` trimmed unparseable content, so a prose row differing only by padding would
   be rewritten under `--apply`. It now returns such content byte for byte, and the test asserts identity.
