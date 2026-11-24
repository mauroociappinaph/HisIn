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
| T5 | S5 | authored sections for the 18 prose-only lessons | included in the lessons commit |

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
- Open: none. The 18 AI-generated prose lessons now carry authored sections (`src/modules/lessons/legacy-content.ts`),
  applied in place by `db:normalize-lessons`; a second run rewrites 0 rows and all 28 lessons report five sections.
- Commits on `feat/stories-interactive`: `ecfd7f6` (patterns) and `75b6b1b` (lessons + content).
- Delivery shape: the branch already carries 34 commits and ~58k authored lines since `main`, far past one
  reviewable slice, so publishing needs chained PRs; these two commits are one reviewable slice each.

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

L6. The 18 AI-generated prose lessons found in the database cannot be given the five sections without
authored content, so they were left intact and are listed by `db:normalize-lessons`. T5 records the
open decision: author them, or regenerate/replace them.
