import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { LevelBadge } from "@/components/vocab-ui";
import { TopicRepository, type TopicDTO } from "@/modules/topics/repository";
import { SKILL_LABELS } from "@/modules/topics/schema";
import { groupByUnit } from "@/modules/topics/grouping";
import {
  extractFormula,
  objectivesFor,
  pairCorrection,
  parseLesson,
  readingMinutes,
  timelineFor,
  wordCount,
} from "@/modules/topics/lesson";
import { GLOSS_KIND_LABELS, type GlossEntry } from "@/modules/topics/glossary";
import { GenerateMaterials } from "./generate-materials";
import { StoryReader } from "./story-reader";
import { TopicNav } from "./topic-nav";
import { Drill } from "./drill";

/** Where this submodule sits in its module, and which ones come next. */
function placement(topics: TopicDTO[], slug: string) {
  const index = topics.findIndex((topic) => topic.slug === slug);
  const unit = groupByUnit(topics).find((group) => group.topics.some((topic) => topic.slug === slug));
  const position = unit ? unit.topics.findIndex((topic) => topic.slug === slug) + 1 : 0;
  return {
    unitName: unit?.unit ?? "Otros temas",
    unitOrder: unit?.order ?? 0,
    position,
    total: unit?.topics.length ?? 1,
    previous: index > 0 ? topics[index - 1] : undefined,
    next: index >= 0 && index < topics.length - 1 ? topics[index + 1] : undefined,
  };
}

type StepGlyph = "idea" | "structure" | "trap" | "verbs" | "practice" | "read" | "write" | "story";

/**
 * One glyph per step, drawn inline: an icon that says what the card does beats a
 * coloured dot, and an inline path keeps the page free of an icon dependency.
 */
function StepGlyph({ kind }: { kind: StepGlyph }) {
  const paths: Record<StepGlyph, ReactNode> = {
    idea: <path d="M9 15a4 4 0 1 1 6 0v2h-6v-2Zm1 4h4m-3 2h2" />,
    structure: <path d="M8 6H6v12h2m8-12h2v12h-2M11 9v6m2-6v6" />,
    trap: <path d="M12 4l8 14H4L12 4Zm0 4v5m0 2v1" />,
    verbs: <path d="M4 12h10m0 0-3-3m3 3-3 3m7-8v10" />,
    practice: <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" />,
    read: <path d="M5 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H5V5Zm14 0h-4a3 3 0 0 0-2 1v13a2 2 0 0 1 2-2h4V5Z" />,
    write: <path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17v3Zm11-13 2 2" />,
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
    <section id={id} className="scroll-mt-24 rounded-lg bg-white border border-slate-200 p-5 space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700 tabular-nums">
              {number}
            </span>
            <span className="text-indigo-600">
              <StepGlyph kind={glyph} />
            </span>
            {title}
          </h2>
          <span className="text-[11px] uppercase tracking-widest text-slate-400">{effort}</span>
        </div>
        {hint ? <p className="text-xs text-slate-500 pl-9">{hint}</p> : null}
      </header>
      {children}
    </section>
  );
}

function KeyPoints({ points }: { points: readonly string[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="space-y-1 border-t border-slate-200 pt-3">
      {points.map((point) => (
        <li key={point} className="text-xs text-slate-600 flex gap-2">
          <span aria-hidden="true" className="text-indigo-600">
            →
          </span>
          {point}
        </li>
      ))}
    </ul>
  );
}

function Prose({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-slate-800">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

const SPAN_BOX: Record<string, { x: number; w: number }> = {
  "past-point": { x: 44, w: 22 },
  "past-to-now": { x: 44, w: 176 },
  "now-forward": { x: 196, w: 120 },
  hypothetical: { x: 196, w: 120 },
};

/**
 * Time, drawn: three fixed zones with guides, the zone the structure lives in
 * highlighted, and the caption saying why. A tense rule is a claim about time, so
 * the picture carries the same information the paragraph does, faster.
 */
function Timeline({ span, caption }: { span: string; caption: string }) {
  const box = SPAN_BOX[span] ?? SPAN_BOX["past-to-now"];
  const dashed = span === "hypothetical";
  return (
    <figure className="space-y-1 rounded-sm bg-slate-50 p-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">En la línea del tiempo</figcaption>
      <svg viewBox="0 0 340 64" className="w-full max-w-md" role="img" aria-label={`Línea de tiempo: ${caption}`}>
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
          pasado
        </text>
        <text x="192" y="24" className="fill-slate-500 text-[10px]">
          ahora / después
        </text>
        <text x="188" y="58" textAnchor="middle" className="fill-indigo-700 text-[10px] font-semibold">
          ahora
        </text>
      </svg>
      <p className="text-xs text-slate-600">{caption}</p>
    </figure>
  );
}

/** The structure as coloured blocks, with the role of each block spelled out. */
function Formula({ segments }: { segments: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">La estructura</p>
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
      <p className="text-xs text-slate-500">
        Los bloques van siempre en este orden: cambiar el orden cambia el significado.
      </p>
    </div>
  );
}

/** Wrong above, right below, each with its own colour and its own explanation. */
function Correction({ wrong, right }: { wrong: string; right: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-sm border border-rose-200 bg-rose-50/70 p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-rose-700">Así no</p>
        <p className="text-sm text-slate-800 line-through decoration-rose-400/70">{wrong}</p>
      </div>
      <div className="rounded-sm border border-emerald-200 bg-emerald-50/70 p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-emerald-700">Así sí</p>
        <p className="text-sm font-medium text-slate-900">{right}</p>
      </div>
    </div>
  );
}

/** A term table: term, translation, kind. Separated, so nothing reads as one blob. */
function TermTable({ entries }: { entries: readonly GlossEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-slate-400">
            <th className="py-1 pr-2 font-medium">Término</th>
            <th className="py-1 pr-2 font-medium">En español</th>
            <th className="py-1 font-medium">Tipo</th>
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

/** A small labelled bar: how long a text is, how many words to write. */
function MiniBar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
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
  const [topic, topics] = await Promise.all([repository.findBySlug(slug), repository.list()]);

  if (!topic) {
    return (
      <div className="rounded-lg bg-white border border-slate-200 p-8 text-center space-y-2">
        <p className="font-medium text-slate-700">Ese tema todavía no existe.</p>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          Volver a los módulos
        </Link>
      </div>
    );
  }

  const where = placement(topics, slug);
  const grammar = topic.materials.find((material) => material.skill === "GRAMMAR");
  const reading = topic.materials.find((material) => material.skill === "READING");
  const writing = topic.materials.find((material) => material.skill === "WRITING");
  const story = topic.materials.find((material) => material.skill === "STORY");
  const lesson = grammar ? parseLesson(grammar.body) : null;
  const objectives = grammar ? objectivesFor(grammar.keyPoints) : [];
  const formula = grammar ? extractFormula(grammar.body, grammar.keyPoints) : [];
  const correction = pairCorrection(lesson?.trap ?? null);
  const timeline = timelineFor(grammar?.title ?? topic.title);
  const examples = (lesson?.examples ?? []).filter(
    (example) => example.trim().split(/\s+/).length >= 3 && !example.trim().endsWith("+"),
  );

  // The multi-word units the topic itself teaches: phrasal verbs, patterns,
  // collocations and idioms, which are exactly the part a list of single words
  // never explains.
  const multiWord = topic.glosses
    .filter((entry) => entry.kind !== "word")
    .sort((first, second) => first.term.localeCompare(second.term));
  const readingText = reading?.body.toLowerCase() ?? "";
  const readingGlosses = topic.glosses.filter((entry) => readingText.includes(entry.term.toLowerCase()));

  const steps = [
    grammar ? "idea" : null,
    grammar ? "estructura" : null,
    grammar ? "trampa" : null,
    multiWord.length > 0 ? "frases" : null,
    grammar ? "practica" : null,
    reading ? "reading" : null,
    writing ? "writing" : null,
    story ? "story" : null,
  ].filter((name): name is string => Boolean(name));
  const stepOf = (name: string) => steps.indexOf(name) + 1;

  const anchors = [
    grammar ? { id: "paso-idea", label: "La idea" } : null,
    grammar ? { id: "paso-estructura", label: "La estructura" } : null,
    grammar ? { id: "paso-trampa", label: "El error" } : null,
    multiWord.length > 0 ? { id: "paso-frases", label: "Frases" } : null,
    grammar ? { id: "paso-practica", label: "Practicá" } : null,
    reading ? { id: "paso-reading", label: SKILL_LABELS.READING } : null,
    writing ? { id: "paso-writing", label: SKILL_LABELS.WRITING } : null,
    story ? { id: "paso-story", label: SKILL_LABELS.STORY } : null,
  ].filter((anchor): anchor is { id: string; label: string } => Boolean(anchor));

  return (
    <div className="space-y-6">
      <nav aria-label="Ubicación" className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
        <Link href="/" className="hover:text-indigo-600">
          Módulos
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/#module-${where.unitOrder}`} className="hover:text-indigo-600">
          {where.unitName}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">{topic.title}</span>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
            {topic.code ?? `#${topic.order}`}
          </span>
          <LevelBadge level={topic.level} />
          {where.total > 1 ? (
            <span className="text-xs text-slate-500">
              Submódulo {where.position} de {where.total}
            </span>
          ) : null}
          {where.total > 1 ? (
            <span className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: where.total }, (_, index) => (
                <span
                  key={index}
                  className={`h-1 w-4 rounded-full ${index < where.position ? "bg-indigo-500" : "bg-slate-200"}`}
                />
              ))}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{topic.title}</h1>

        {objectives.length > 0 ? (
          <div className="rounded-lg bg-white border border-slate-200 p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Al terminar vas a poder</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {objectives.map((objective) => (
                <li key={objective} className="text-xs text-slate-700 flex gap-2">
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
            className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-95"
          >
            Ir a la práctica
          </Link>
          <Link
            href="/review/vocab"
            className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Repasar vocabulario
          </Link>
          <Link
            href={`/#module-${where.unitOrder}`}
            className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Volver al módulo
          </Link>
        </div>
      </header>

      {topic.missing.length > 0 ? (
        <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">
            Falta material de: {topic.missing.map((skill) => SKILL_LABELS[skill]).join(" · ")}
          </h2>
          <p className="text-sm text-slate-600">
            Gentleman Shell lo escribe con foco healthtech, emprendimiento y Silicon Valley, y no guarda nada que
            no pase la validación de dominio.
          </p>
          <GenerateMaterials slug={topic.slug} missing={topic.missing.map((skill) => SKILL_LABELS[skill])} />
        </section>
      ) : null}

      {topic.materials.length === 0 ? (
        <div className="rounded-lg bg-white border border-slate-200 p-8 text-center">
          <p className="text-slate-600 text-sm">Todavía no hay materiales para este tema.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="order-2 lg:order-1 min-w-0 space-y-4">
            <p className="text-xs text-slate-500">
              Lección de {steps.length} pasos · idea, estructura, error, frases, práctica, lectura, escritura e
              historia
            </p>

            {grammar && lesson ? (
              <Step
                id="paso-idea"
                number={stepOf("idea")}
                title="La idea"
                effort="1 min"
                glyph="idea"
                hint="Qué es y para qué te sirve en el trabajo, en dos párrafos."
              >
                <p className="text-base leading-relaxed text-slate-900">{lesson.idea}</p>
                <Prose paragraphs={lesson.body} />
                {timeline ? <Timeline span={timeline.span} caption={timeline.caption} /> : null}
              </Step>
            ) : null}

            {grammar && lesson ? (
              <Step
                id="paso-estructura"
                number={stepOf("estructura")}
                title="La estructura"
                effort="1 min"
                glyph="structure"
                hint="Cómo se arma, y cómo suena en una frase real."
              >
                {formula.length > 1 ? (
                  <Formula segments={formula} />
                ) : (
                  <p className="text-sm text-slate-600">
                    Este tema no se arma por bloques: se reconoce por el contexto. Los ejemplos de abajo son el
                    patrón.
                  </p>
                )}
                {examples.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">En contexto</p>
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
                number={stepOf("trampa")}
                title="El error"
                effort="1 min"
                glyph="trap"
                hint="Lo que hacemos los hispanohablantes, y cómo se dice."
              >
                {correction ? <Correction wrong={correction.wrong} right={correction.right} /> : null}
                {lesson.trap ? <p className="text-xs text-slate-600">{lesson.trap}</p> : null}
              </Step>
            ) : null}

            {multiWord.length > 0 ? (
              <Step
                id="paso-frases"
                number={stepOf("frases")}
                title="Frases hechas del tema"
                effort={`${multiWord.length} términos`}
                glyph="verbs"
                hint="Lo que no se traduce palabra por palabra: va entero."
              >
                <TermTable entries={multiWord.slice(0, 12)} />
                {multiWord.length > 12 ? (
                  <p className="text-[11px] text-slate-400">y {multiWord.length - 12} más en la historia.</p>
                ) : null}
              </Step>
            ) : null}

            {grammar ? (
              <Step
                id="paso-practica"
                number={stepOf("practica")}
                title="Practicá"
                effort="2 min"
                glyph="practice"
                hint="Cuatro preguntas: si fallás, la explicación te dice por qué."
              >
                <Drill slug={topic.slug} />
              </Step>
            ) : null}

            {reading ? (
              <Step
                id="paso-reading"
                number={stepOf("reading")}
                title="Leé"
                effort={`~${readingMinutes(reading.body)} min`}
                glyph="read"
                hint={reading.title}
              >
                <MiniBar
                  label="Largo del texto"
                  value={wordCount(reading.body)}
                  max={400}
                  suffix={`${wordCount(reading.body)} palabras`}
                />
                <Prose paragraphs={reading.body.split(/\n{2,}/).map((part) => part.trim())} />
                <KeyPoints points={reading.keyPoints} />
                {readingGlosses.length > 0 ? (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">Términos del texto</p>
                    <TermTable entries={readingGlosses.slice(0, 10)} />
                  </div>
                ) : null}
              </Step>
            ) : null}

            {writing ? (
              <Step
                id="paso-writing"
                number={stepOf("writing")}
                title="Escribí"
                effort="5 min"
                glyph="write"
                hint={writing.title}
              >
                <Prose paragraphs={writing.body.split(/\n{2,}/).map((part) => part.trim())} />
                <MiniBar
                  label="Objetivo de extensión"
                  value={wordCount(writing.body)}
                  max={wordCount(writing.body)}
                  suffix={`~${wordCount(writing.body)} palabras`}
                />
                <ul className="space-y-1 border-t border-slate-200 pt-3">
                  {writing.keyPoints.map((point) => (
                    <li key={point} className="text-xs text-slate-700 flex gap-2">
                      <span aria-hidden="true" className="text-slate-400">
                        ☐
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </Step>
            ) : null}

            {story ? (
              <Step
                id="paso-story"
                number={stepOf("story")}
                title="La historia"
                effort="3 min"
                glyph="story"
                hint="Leé, escuchá y tocá las palabras que no sepas."
              >
                <StoryReader title={story.title} body={story.body} glosses={topic.glosses} />
              </Step>
            ) : null}

            <nav aria-label="Submódulos" className="grid gap-2 sm:grid-cols-2">
              {where.previous ? (
                <Link
                  href={`/topics/${where.previous.slug}`}
                  className="rounded-lg bg-white border border-slate-200 p-3 hover:border-indigo-300 transition active:scale-[0.99]"
                >
                  <span className="text-[11px] uppercase tracking-widest text-slate-400">← Anterior</span>
                  <p className="text-sm font-medium text-slate-800">{where.previous.title}</p>
                </Link>
              ) : (
                <span />
              )}
              {where.next ? (
                <Link
                  href={`/topics/${where.next.slug}`}
                  className="rounded-lg bg-indigo-600 text-white p-3 hover:bg-indigo-700 transition active:scale-[0.99] sm:text-right"
                >
                  <span className="text-[11px] uppercase tracking-widest text-white/70">Siguiente →</span>
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
          <div className="h-8 w-64 rounded-sm bg-white border border-slate-200 animate-pulse" />
          <div className="h-40 rounded-lg bg-white border border-slate-200 animate-pulse" />
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
