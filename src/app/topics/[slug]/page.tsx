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
  timelineFor,
  readingMinutes,
  wordCount,
} from "@/modules/topics/lesson";
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

/**
 * One step of the lesson: number, plain-language title, and how long it takes.
 *
 * The lesson reads as a sequence of small moves instead of four anonymous text
 * blocks, because that is the difference between a document and a class.
 */
function Step({
  id,
  number,
  title,
  effort,
  children,
}: {
  id: string;
  number: number;
  title: string;
  effort: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-lg bg-white border border-slate-200 p-5 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700 tabular-nums">
            {number}
          </span>
          {title}
        </h2>
        <span className="text-[11px] uppercase tracking-widest text-slate-400">{effort}</span>
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
  const formula = grammar ? extractFormula(grammar.body, grammar.keyPoints) : [];
  const correction = pairCorrection(lesson?.trap ?? null);
  const timeline = timelineFor(grammar?.title ?? topic.title);
  // A quoted fragment of two words is a label, not an example: the formula block
  // already shows those, and a row reading "should have," teaches nothing.
  const examples = (lesson?.examples ?? []).filter(
    (example) => example.trim().split(/\s+/).length >= 3 && !example.trim().endsWith("+"),
  );
  const objectives = grammar ? objectivesFor(grammar.keyPoints) : [];

  const anchors = [
    grammar ? { id: "paso-regla", label: SKILL_LABELS.GRAMMAR } : null,
    grammar ? { id: "paso-practica", label: "Practicá" } : null,
    reading ? { id: "paso-reading", label: SKILL_LABELS.READING } : null,
    writing ? { id: "paso-writing", label: SKILL_LABELS.WRITING } : null,
    story ? { id: "paso-story", label: SKILL_LABELS.STORY } : null,
  ].filter((anchor): anchor is { id: string; label: string } => Boolean(anchor));

  // Words of this topic that the reading actually uses: the glossary was built
  // from the story, so a term only earns a chip when it also shows up here.
  const readingText = reading?.body.toLowerCase() ?? "";
  const readingGlosses = topic.glosses
    .filter((entry) => readingText.includes(entry.term.toLowerCase()))
    .slice(0, 10);

  // Numbered in reading order, skipping the steps whose material is missing.
  const steps = [grammar ? "regla" : null, grammar ? "practica" : null, reading ? "reading" : null, writing ? "writing" : null, story ? "story" : null].filter(
    (name): name is string => Boolean(name),
  );
  const stepOf = (name: string) => steps.indexOf(name) + 1;
  const stepCount = steps.length;

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
              Lección de {stepCount} pasos · regla, práctica, lectura, escritura e historia
            </p>

            {grammar && lesson ? (
              <Step id="paso-regla" number={stepOf("regla")} title="La regla" effort="2 min">
                <p className="text-base leading-relaxed text-slate-900">{lesson.idea}</p>
                <Prose paragraphs={lesson.body} />
                {timeline ? <Timeline span={timeline.span} caption={timeline.caption} /> : null}

                {formula.length > 1 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">La fórmula</p>
                    <div className="flex flex-wrap items-center gap-1.5 rounded-sm bg-slate-50 p-3 font-mono text-sm">
                      {formula.map((segment, index) => (
                        <span key={`${segment}-${index}`} className="flex items-center gap-1.5">
                          {index > 0 ? (
                            <span aria-hidden="true" className="text-slate-400">
                              +
                            </span>
                          ) : null}
                          <span className="rounded-sm bg-indigo-600 px-2 py-1 text-white">{segment}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {correction ? (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">
                      Así no · así sí
                    </p>
                    <div className="overflow-hidden rounded-sm border border-slate-200">
                      <p className="flex items-start gap-2 border-l-4 border-rose-400 bg-rose-50/60 px-3 py-2 text-sm text-slate-800">
                        <span aria-hidden="true" className="font-bold text-rose-600">
                          ✗
                        </span>
                        <span className="line-through decoration-rose-400/70">{correction.wrong}</span>
                      </p>
                      <p className="flex items-start gap-2 border-l-4 border-emerald-400 bg-emerald-50/60 px-3 py-2 text-sm font-medium text-slate-900">
                        <span aria-hidden="true" className="font-bold text-emerald-600">
                          ✓
                        </span>
                        {correction.right}
                      </p>
                    </div>
                    {lesson.trap ? <p className="text-xs text-slate-500">{lesson.trap}</p> : null}
                  </div>
                ) : lesson.trap ? (
                  <div className="rounded-sm border-l-4 border-amber-400 bg-slate-50 p-3 space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-amber-600">
                      La trampa del hispanohablante
                    </p>
                    <p className="text-sm text-slate-800">{lesson.trap}</p>
                  </div>
                ) : null}

                {examples.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">En contexto</p>
                    {examples.map((example) => (
                      <p key={example} className="text-sm text-slate-800 flex gap-2">
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

            {grammar ? (
              <Step id="paso-practica" number={stepOf("practica")} title="Practicá" effort="2 min">
                <Drill slug={topic.slug} />
              </Step>
            ) : null}

            {reading ? (
              <Step
                id="paso-reading"
                number={stepOf("reading")}
                title="Leé"
                effort={`~${readingMinutes(reading.body)} min`}
              >
                <p className="text-[11px] uppercase tracking-widest text-slate-500">{reading.title}</p>
                <Prose paragraphs={reading.body.split(/\n{2,}/).map((part) => part.trim())} />
                <KeyPoints points={reading.keyPoints} />
                {readingGlosses.length > 0 ? (
                  <div className="space-y-1 border-t border-slate-200 pt-3">
                    <p className="text-[11px] uppercase tracking-widest text-slate-500">Palabras del tema</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {readingGlosses.map((entry) => (
                        <li key={entry.term}>
                          <Link
                            href="/review/vocab"
                            className="inline-flex items-baseline gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-800 hover:bg-indigo-100 transition"
                          >
                            <span className="font-semibold">{entry.term}</span>
                            <span className="text-indigo-600">· {entry.translation}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Step>
            ) : null}

            {writing ? (
              <Step id="paso-writing" number={stepOf("writing")} title="Escribí" effort="5 min">
                <p className="text-[11px] uppercase tracking-widest text-slate-500">{writing.title}</p>
                <Prose paragraphs={writing.body.split(/\n{2,}/).map((part) => part.trim())} />
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
                <p className="text-[11px] text-slate-500">
                  Apuntá a ~{wordCount(writing.body)} palabras, como el modelo.
                </p>
              </Step>
            ) : null}

            {story ? (
              <Step id="paso-story" number={stepOf("story")} title="La historia" effort="3 min">
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

const SPAN_BOX: Record<string, { x: number; w: number }> = {
  "past-point": { x: 44, w: 22 },
  "past-to-now": { x: 44, w: 176 },
  "now-forward": { x: 196, w: 120 },
  hypothetical: { x: 196, w: 120 },
};

/**
 * The rule of a tense is a claim about time, so the page draws time.
 *
 * Three fixed zones (past, now, after) and one highlighted span: enough to see
 * which part of the line the structure talks about, and also enough to see that
 * "hypothetical" sits where the future sits but is not the future.
 */
function Timeline({ span, caption }: { span: string; caption: string }) {
  const box = SPAN_BOX[span] ?? SPAN_BOX["past-to-now"];
  const dashed = span === "hypothetical";
  return (
    <figure className="space-y-1">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">En la línea del tiempo</figcaption>
      <svg viewBox="0 0 340 56" className="w-full max-w-md" role="img" aria-label={`Línea de tiempo: ${caption}`}>
        <line x1="12" y1="34" x2="328" y2="34" stroke="currentColor" className="text-slate-300" strokeWidth="2" />
        <circle cx="188" cy="34" r="5" className="fill-indigo-600" />
        <text x="188" y="52" textAnchor="middle" className="fill-slate-500 text-[10px]">
          ahora
        </text>
        <rect
          x={box.x}
          y="22"
          width={box.w}
          height="12"
          rx="6"
          className="fill-indigo-100 stroke-indigo-400"
          strokeWidth="1.5"
          strokeDasharray={dashed ? "4 3" : undefined}
        />
        <text x="44" y="16" className="fill-slate-400 text-[10px]">
          pasado
        </text>
        <text x="320" y="16" textAnchor="end" className="fill-slate-400 text-[10px]">
          después
        </text>
      </svg>
      <p className="text-xs text-slate-600">{caption}</p>
    </figure>
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
