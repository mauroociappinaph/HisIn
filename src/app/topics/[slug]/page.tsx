import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { LevelBadge } from "@/components/vocab-ui";
import { TopicRepository, type TopicDTO } from "@/modules/topics/repository";
import { groupByUnit } from "@/modules/topics/grouping";
import {
  extractFormula,
  objectivesFor,
  pairCorrection,
  parseLesson,
  readingMinutes,
  splitIdea,
  timelineFor,
  toParagraphs,
  wordCount,
} from "@/modules/topics/lesson";
import { GLOSS_KIND_LABELS, type GlossEntry } from "@/modules/topics/glossary";
import { getLocalUser } from "@/modules/identity/service";
import { GenerateMaterials } from "./generate-materials";
import { StoryReader } from "./story-reader";
import { TopicNav } from "./topic-nav";
import { Drill } from "./drill";
import { LessonDone } from "./lesson-done";
import { RolePlay } from "./role-play";
import { TrendChart } from "./charts";
import { ConditionalFlow, QuoteBanner } from "./lesson-visuals";

/** Where this submodule sits in its module, and which ones come next. */
function placement(topics: TopicDTO[], slug: string) {
  const index = topics.findIndex((topic) => topic.slug === slug);
  const unit = groupByUnit(topics).find((group) => group.topics.some((topic) => topic.slug === slug));
  const position = unit ? unit.topics.findIndex((topic) => topic.slug === slug) + 1 : 0;
  return {
    unitName: unit?.unit ?? "Other modules",
    unitOrder: unit?.order ?? 0,
    position,
    total: unit?.topics.length ?? 1,
    previous: index > 0 ? topics[index - 1] : undefined,
    next: index >= 0 && index < topics.length - 1 ? topics[index + 1] : undefined,
  };
}

type StepGlyph = "idea" | "structure" | "trap" | "verbs" | "practice" | "read" | "write" | "speak" | "story";

/** One glyph per step, drawn inline: an icon says what a card does faster than a dot. */
function StepGlyph({ kind }: { kind: StepGlyph }) {
  const paths: Record<StepGlyph, ReactNode> = {
    idea: <path d="M9 15a4 4 0 1 1 6 0v2h-6v-2Zm1 4h4m-3 2h2" />,
    structure: <path d="M8 6H6v12h2m8-12h2v12h-2M11 9v6m2-6v6" />,
    trap: <path d="M12 4l8 14H4L12 4Zm0 4v5m0 2v1" />,
    verbs: <path d="M4 12h10m0 0-3-3m3 3-3 3m7-8v10" />,
    practice: <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" />,
    read: <path d="M5 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H5V5Zm14 0h-4a3 3 0 0 0-2 1v13a2 2 0 0 1 2-2h4V5Z" />,
    write: <path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3Zm11-13 2 2" />,
    speak: <path d="M4 10v4h3l4 3V7L7 10H4Zm11-2a5 5 0 0 1 0 8m2-10a8 8 0 0 1 0 12" />,
    story: <path d="M4 6h9a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H4V6Zm16 0h-3v14a2 2 0 0 1 2-2h1V6Z" />,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {paths[kind]}
    </svg>
  );
}

function Step({
  id,
  number,
  title,
  effort,
  glyph,
  hint,
  children,
}: {
  id: string;
  number: number;
  title: string;
  effort: string;
  glyph: StepGlyph;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      {/* The title lives above the card, large: you should know what the step is
          before you read what it says. */}
      <header className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 px-1">
        <h2 className="flex items-baseline gap-3 text-slate-900">
          <span className="text-2xl font-black leading-none tabular-nums text-indigo-600">
            {String(number).padStart(2, "0")}
          </span>
          <span className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <span className="text-indigo-500">
              <StepGlyph kind={glyph} />
            </span>
            {title}
          </span>
        </h2>
        <span className="text-[11px] uppercase tracking-widest text-slate-400">{effort}</span>
      </header>
      {hint ? <p className="px-1 text-xs text-slate-500">{hint}</p> : null}
      <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">{children}</div>
    </section>
  );
}

/** Paragraphs with room to breathe: the text was called cramped, and it was. */
function Prose({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="max-w-prose space-y-5">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="text-[15px] leading-8 text-slate-800">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/** The lead paragraph as numbered points, one idea per line. */
function IdeaPoints({ points }: { points: { text: string; kind: "point" | "example" }[] }) {
  return (
    <ol className="space-y-3">
      {points.map((point, index) => (
        <li
          key={point.text.slice(0, 40)}
          className={`flex gap-3 rounded-sm p-3 ${
            point.kind === "example" ? "border-l-4 border-emerald-400 bg-slate-50" : "border-l-4 border-indigo-300 bg-white"
          }`}
        >
          <span
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums ${
              point.kind === "example" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-700"
            }`}
          >
            {point.kind === "example" ? "e.g." : index + 1}
          </span>
          <p className="text-[15px] leading-7 text-slate-800">{point.text}</p>
        </li>
      ))}
    </ol>
  );
}

function KeyPoints({ points }: { points: readonly string[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="space-y-1 border-t border-slate-200 pt-3">
      {points.map((point) => (
        <li key={point} className="flex gap-2 text-xs text-slate-600">
          <span aria-hidden="true" className="text-indigo-600">
            →
          </span>
          {point}
        </li>
      ))}
    </ul>
  );
}

const SPAN_BOX: Record<string, { x: number; w: number }> = {
  "past-point": { x: 44, w: 22 },
  "past-to-now": { x: 44, w: 176 },
  "now-forward": { x: 196, w: 120 },
  hypothetical: { x: 196, w: 120 },
};

function Timeline({ span, caption }: { span: string; caption: string }) {
  const box = SPAN_BOX[span] ?? SPAN_BOX["past-to-now"];
  const dashed = span === "hypothetical";
  return (
    <figure className="space-y-1 rounded-sm bg-slate-50 p-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">On the timeline</figcaption>
      <svg viewBox="0 0 340 64" className="w-full max-w-md" role="img" aria-label={`Timeline: ${caption}`}>
        <rect x="32" y="10" width="152" height="40" rx="6" className="fill-slate-100" />
        <rect x="184" y="10" width="124" height="40" rx="6" className="fill-white" />
        <line x1="12" y1="36" x2="328" y2="36" stroke="currentColor" className="text-slate-300" strokeWidth="2" />
        <line x1="184" y1="12" x2="184" y2="60" stroke="currentColor" className="text-slate-300" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="188" cy="36" r="5" className="fill-indigo-600" />
        <rect
          x={box.x}
          y="24"
          width={box.w}
          height="12"
          rx="6"
          className="fill-indigo-100 stroke-indigo-500"
          strokeWidth="1.5"
          strokeDasharray={dashed ? "4 3" : undefined}
        />
        <text x="40" y="24" className="fill-slate-500 text-[10px]">
          past
        </text>
        <text x="192" y="24" className="fill-slate-500 text-[10px]">
          now / after
        </text>
        <text x="188" y="58" textAnchor="middle" className="fill-indigo-700 text-[10px] font-semibold">
          now
        </text>
      </svg>
      <p className="text-xs text-slate-600">{caption}</p>
    </figure>
  );
}

function Formula({ segments }: { segments: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">The structure</p>
      <div className="flex flex-wrap items-center gap-2 rounded-sm bg-slate-50 p-3">
        {segments.map((segment, index) => (
          <span key={`${segment}-${index}`} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="font-mono text-slate-400">
                +
              </span>
            ) : null}
            <span className="rounded-sm bg-indigo-600 px-2.5 py-1 font-mono text-sm text-white">{segment}</span>
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500">The blocks always come in this order: change the order and the meaning changes.</p>
    </div>
  );
}

function Correction({ wrong, right }: { wrong: string; right: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1 rounded-sm border border-rose-200 bg-rose-50/70 p-3">
        <p className="text-[11px] uppercase tracking-widest text-rose-700">Not this</p>
        <p className="text-sm text-slate-800 line-through decoration-rose-400/70">{wrong}</p>
      </div>
      <div className="space-y-1 rounded-sm border border-emerald-200 bg-emerald-50/70 p-3">
        <p className="text-[11px] uppercase tracking-widest text-emerald-700">This</p>
        <p className="text-sm font-medium text-slate-900">{right}</p>
      </div>
    </div>
  );
}

function TermTable({ entries }: { entries: readonly GlossEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-slate-400">
            <th className="py-1 pr-2 font-medium">Term</th>
            <th className="py-1 pr-2 font-medium">Meaning</th>
            <th className="py-1 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.term} className="border-t border-slate-100 align-top">
              <td className="py-1.5 pr-2 font-semibold text-slate-900">{entry.term}</td>
              <td className="py-1.5 pr-2 text-slate-700">{entry.translation}</td>
              <td className="py-1.5">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo-700">
                  {GLOSS_KIND_LABELS[entry.kind]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SizeBar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const ratio = Math.max(0.04, Math.min(1, value / max));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span className="tabular-nums text-slate-700">{suffix}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

async function TopicBody({ slug }: { slug: string }) {
  const repository = new TopicRepository();
  const user = await getLocalUser();
  const [topic, topics, doneIds, unitPrologues] = await Promise.all([
    repository.findBySlug(slug),
    repository.list(),
    repository.completions(user.id),
    repository.unitPrologues(),
  ]);

  if (!topic) {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium text-slate-700">That lesson does not exist yet.</p>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          Back to the modules
        </Link>
      </div>
    );
  }

  const where = placement(topics, slug);
  const moduleTopics = topics.filter((entry) => entry.unit === topic.unit);
  const moduleDone = moduleTopics.filter((entry) => doneIds.includes(entry.id)).length;
  const modulePrologue = unitPrologues.get(where.unitOrder) ?? null;

  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");
  const reading = topic.materials.find((material) => material.skill === "READING");
  const writing = topic.materials.find((material) => material.skill === "WRITING");
  const story = topic.materials.find((material) => material.skill === "STORY");
  const lesson = grammar ? parseLesson(grammar.body) : null;
  const ideaPoints = lesson ? splitIdea(lesson.idea) : [];
  const objectives = grammar ? objectivesFor(grammar.keyPoints) : [];
  const formula = grammar ? extractFormula(grammar.body, grammar.keyPoints) : [];
  const correction = pairCorrection(lesson?.trap ?? null);
  const timeline = timelineFor(grammar?.title ?? topic.title);
  const lower = `${grammar?.title ?? topic.title} ${grammar?.body ?? ""}`.toLowerCase();
  const conditional = /conditional/.test(lower)
    ? { kind: "conditional" as const, variant: /third|mixed/.test(lower) ? ("third" as const) : /second/.test(lower) ? ("second" as const) : /first/.test(lower) ? ("first" as const) : ("zero" as const) }
    : null;
  const showsChart = /data commentary|results|statistic|chart|trend|mrr|revenue/.test(lower);
  const examples = (lesson?.examples ?? []).filter(
    (example) => example.trim().split(/\s+/).length >= 3 && !example.trim().endsWith("+"),
  );

  const multiWord = topic.glosses
    .filter((entry) => entry.kind !== "word")
    .sort((first, second) => first.term.localeCompare(second.term));
  const readingText = reading?.body.toLowerCase() ?? "";
  const readingGlosses = topic.glosses.filter((entry) => readingText.includes(entry.term.toLowerCase()));

  const steps = [
    grammar ? "idea" : null,
    grammar ? "structure" : null,
    grammar ? "trap" : null,
    multiWord.length > 0 ? "phrases" : null,
    grammar ? "practice" : null,
    reading ? "reading" : null,
    writing ? "writing" : null,
    "roleplay",
    story ? "story" : null,
  ].filter((name): name is string => Boolean(name));
  const stepOf = (name: string) => steps.indexOf(name) + 1;

  const anchors = [
    grammar ? { id: "paso-idea", label: "The idea" } : null,
    grammar ? { id: "paso-estructura", label: "Structure" } : null,
    grammar ? { id: "paso-trampa", label: "The trap" } : null,
    multiWord.length > 0 ? { id: "paso-frases", label: "Set phrases" } : null,
    grammar ? { id: "paso-practica", label: "Practice" } : null,
    reading ? { id: "paso-reading", label: "Reading" } : null,
    writing ? { id: "paso-writing", label: "Writing" } : null,
    { id: "paso-roleplay", label: "Role-play" },
    story ? { id: "paso-story", label: "Story" } : null,
  ].filter((anchor): anchor is { id: string; label: string } => Boolean(anchor));

  return (
    <div className="space-y-6">
      {/* Breadcrumb: module above, the whole chain clickable, no dead ends. */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <Link href="/" className="rounded-sm px-1.5 py-0.5 hover:bg-slate-100 hover:text-indigo-700">
          Modules
        </Link>
        <span aria-hidden="true" className="text-slate-300">
          ›
        </span>
        <Link
          href={`/#module-${where.unitOrder}`}
          className="rounded-sm px-1.5 py-0.5 font-medium hover:bg-slate-100 hover:text-indigo-700"
        >
          {where.unitName}
        </Link>
        <span aria-hidden="true" className="text-slate-300">
          ›
        </span>
        <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
          {topic.code ?? `#${topic.order}`}
        </span>
        <span className="text-slate-700">{topic.title}</span>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <LevelBadge level={topic.level} />
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            Submodule {where.position} of {where.total}
          </span>
          <span className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: Math.min(where.total, 12) }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 w-4 rounded-full ${index < where.position ? "bg-indigo-500" : "bg-slate-200"}`}
              />
            ))}
          </span>
        </div>

        {topic.quote ? <QuoteBanner quote={topic.quote} module={where.unitName} title={topic.title} /> : null}

        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{topic.title}</h1>

        {modulePrologue ? (
          <div className="max-w-prose space-y-1 border-l-2 border-slate-200 pl-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">The module</p>
            <p className="text-sm leading-7 text-slate-600">{modulePrologue}</p>
          </div>
        ) : null}

        {topic.prologue ? (
          <div className="max-w-prose space-y-1">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">This lesson</p>
            <p className="text-[15px] leading-8 text-slate-800">{topic.prologue}</p>
          </div>
        ) : null}

        <LessonDone
          slug={topic.slug}
          initialDone={doneIds.includes(topic.id)}
          completed={moduleDone}
          total={moduleTopics.length}
        />

        {objectives.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">By the end you can</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {objectives.map((objective) => (
                <li key={objective} className="flex gap-2 text-xs text-slate-700">
                  <span aria-hidden="true" className="text-emerald-600">
                    ✓
                  </span>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link
            href="#paso-practica"
            className="rounded-sm bg-indigo-600 px-3 py-1.5 text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Go to practice
          </Link>
          <Link
            href="#paso-roleplay"
            className="rounded-sm bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200"
          >
            Role-play
          </Link>
          <Link href="/review/vocab" className="rounded-sm bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200">
            Review vocabulary
          </Link>
          <Link
            href={`/#module-${where.unitOrder}`}
            className="rounded-sm bg-slate-100 px-3 py-1.5 text-slate-700 transition hover:bg-slate-200"
          >
            Back to module
          </Link>
        </div>
      </header>

      {topic.missing.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-800">
            Missing material: {topic.missing.map((skill) => skill.toLowerCase()).join(" · ")}
          </h2>
          <p className="text-sm text-slate-600">
            The engine writes it in healthtech and Silicon Valley context and refuses anything that fails the domain
            check.
          </p>
          <GenerateMaterials slug={topic.slug} missing={topic.missing.map((skill) => skill.toLowerCase())} />
        </section>
      ) : null}

      {topic.materials.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">No material for this lesson yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="order-2 min-w-0 space-y-4 lg:order-1">
            <p className="text-xs text-slate-500">
              {steps.length} steps · idea, structure, trap, phrases, practice, reading, writing, role-play and story
            </p>

            {grammar && lesson ? (
              <Step
                id="paso-idea"
                number={stepOf("idea")}
                title="The idea"
                effort="1 min"
                glyph="idea"
                hint="One point per line, so nothing hides inside a paragraph."
              >
                <IdeaPoints points={ideaPoints} />
                <Prose paragraphs={lesson.body} />
                {timeline ? <Timeline span={timeline.span} caption={timeline.caption} /> : null}
                {conditional ? <ConditionalFlow kind={conditional.variant} /> : null}
                {showsChart ? (
                  <TrendChart caption="Say the jump, not every bar: the pilots doubled in the last two quarters." />
                ) : null}
              </Step>
            ) : null}

            {grammar && lesson ? (
              <Step
                id="paso-estructura"
                number={stepOf("structure")}
                title="The structure"
                effort="1 min"
                glyph="structure"
                hint="How it is built, and how it sounds in a real sentence."
              >
                {formula.length > 1 ? (
                  <Formula segments={formula} />
                ) : (
                  <p className="text-sm text-slate-600">
                    This lesson has no fixed blocks: you recognise it by context. The examples below are the pattern.
                  </p>
                )}
                {examples.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">In context</p>
                    {examples.map((example) => (
                      <p
                        key={example}
                        className="flex gap-2 rounded-sm border-l-2 border-emerald-400 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
                      >
                        <span aria-hidden="true" className="text-emerald-600">
                          ✓
                        </span>
                        {example}
                      </p>
                    ))}
                  </div>
                ) : null}
                <KeyPoints points={grammar.keyPoints} />
              </Step>
            ) : null}

            {lesson && (correction || lesson.trap) ? (
              <Step
                id="paso-trampa"
                number={stepOf("trap")}
                title="The trap"
                effort="1 min"
                glyph="trap"
                hint="What Spanish speakers do, and what to say instead."
              >
                {correction ? <Correction wrong={correction.wrong} right={correction.right} /> : null}
                {lesson.trap ? <p className="text-sm leading-7 text-slate-700">{lesson.trap}</p> : null}
              </Step>
            ) : null}

            {multiWord.length > 0 ? (
              <Step
                id="paso-frases"
                number={stepOf("phrases")}
                title="Set phrases"
                effort={`${multiWord.length} terms`}
                glyph="verbs"
                hint="What does not translate word by word: it goes in one piece."
              >
                <TermTable entries={multiWord.slice(0, 12)} />
              </Step>
            ) : null}

            {grammar ? (
              <Step
                id="paso-practica"
                number={stepOf("practice")}
                title="Practice"
                effort="2 min"
                glyph="practice"
                hint="Four items: when you miss one, the explanation says why."
              >
                <Drill slug={topic.slug} />
              </Step>
            ) : null}

            {reading ? (
              <Step
                id="paso-reading"
                number={stepOf("reading")}
                title="Read"
                effort={`~${readingMinutes(reading.body)} min`}
                glyph="read"
                hint="Short read on the same structure, in a real work scene."
              >
                <SizeBar
                  label="Text length"
                  value={wordCount(reading.body)}
                  max={400}
                  suffix={`${wordCount(reading.body)} words`}
                />
                <Prose paragraphs={toParagraphs(reading.body)} />
                <KeyPoints points={reading.keyPoints} />
                {readingGlosses.length > 0 ? (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">Terms in the text</p>
                    <TermTable entries={readingGlosses.slice(0, 10)} />
                  </div>
                ) : null}
              </Step>
            ) : null}

            {writing ? (
              <Step
                id="paso-writing"
                number={stepOf("writing")}
                title="Write"
                effort="5 min"
                glyph="write"
                hint="Writing is what fixes the structure: do not skip it."
              >
                <Prose paragraphs={toParagraphs(writing.body)} />
                <SizeBar
                  label="Target length"
                  value={wordCount(writing.body)}
                  max={wordCount(writing.body)}
                  suffix={`~${wordCount(writing.body)} words`}
                />
                <ul className="space-y-1 border-t border-slate-200 pt-3">
                  {writing.keyPoints.map((point) => (
                    <li key={point} className="flex gap-2 text-xs text-slate-700">
                      <span aria-hidden="true" className="text-slate-400">
                        ☐
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Step>
            ) : null}

            <Step
              id="paso-roleplay"
              number={stepOf("roleplay")}
              title="Role-play"
              effort="4 min"
              glyph="speak"
              hint="Say it out loud after writing it: the room is where it counts."
            >
              <RolePlay slug={topic.slug} />
            </Step>

            {story ? (
              <Step
                id="paso-story"
                number={stepOf("story")}
                title="The story"
                effort="3 min"
                glyph="story"
                hint="Read, listen, and tap the words you do not know."
              >
                <StoryReader title={story.title} body={story.body} glosses={topic.glosses} />
              </Step>
            ) : null}

            <nav aria-label="Submodules" className="grid gap-2 sm:grid-cols-2">
              {where.previous ? (
                <Link
                  href={`/topics/${where.previous.slug}`}
                  className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-indigo-300 active:scale-[0.99]"
                >
                  <span className="text-[11px] uppercase tracking-widest text-slate-400">← Previous</span>
                  <p className="text-sm font-medium text-slate-800">{where.previous.title}</p>
                </Link>
              ) : (
                <span />
              )}
              {where.next ? (
                <Link
                  href={`/topics/${where.next.slug}`}
                  className="rounded-lg bg-indigo-600 p-3 text-white transition hover:bg-indigo-700 active:scale-[0.99] sm:text-right"
                >
                  <span className="text-[11px] uppercase tracking-widest text-white/70">Next →</span>
                  <p className="text-sm font-semibold">{where.next.title}</p>
                </Link>
              ) : null}
            </nav>
          </div>

          {anchors.length > 0 ? (
            <div className="order-1 lg:order-2">
              <TopicNav items={anchors} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3" aria-busy="true">
          <div className="h-8 w-64 animate-pulse rounded-sm border border-slate-200 bg-white" />
          <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white" />
        </div>
      }
    >
      <TopicRoute params={params} />
    </Suspense>
  );
}

async function TopicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TopicBody slug={slug} />;
}
