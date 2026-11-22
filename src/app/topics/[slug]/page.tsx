import Link from "next/link";
import { Suspense } from "react";
import { LevelBadge } from "@/components/vocab-ui";
import { TopicRepository, type TopicDTO } from "@/modules/topics/repository";
import { SKILL_LABELS, type TopicSkill } from "@/modules/topics/schema";
import { groupByUnit } from "@/modules/topics/grouping";
import { GenerateMaterials } from "./generate-materials";
import { StoryReader } from "./story-reader";
import { TopicNav } from "./topic-nav";

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
  const anchors = topic.materials.map((material) => ({
    id: `material-${material.skill.toLowerCase()}`,
    label: SKILL_LABELS[material.skill as TopicSkill],
  }));

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
                  className={`h-1 w-4 rounded-full ${
                    index < where.position ? "bg-indigo-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{topic.title}</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Cuatro materiales del mismo tema, todos en contexto healthtech y Silicon Valley: la regla, un texto, una
          tarea de escritura y una historia que la usa.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link
            href="/review/vocab"
            className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-95"
          >
            Repasar vocabulario
          </Link>
          <Link
            href="/grammar"
            className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Ver la gramática
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
          <div className="space-y-4 min-w-0 order-2 lg:order-1">
            {topic.materials.map((material) => (
              <article
                key={material.skill}
                id={`material-${material.skill.toLowerCase()}`}
                className="scroll-mt-24 rounded-lg bg-white border border-slate-200 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-widest text-slate-500">
                    {SKILL_LABELS[material.skill as TopicSkill]}
                  </span>
                  <span className="text-[11px] text-slate-400">{material.title}</span>
                </div>
                {material.skill === "STORY" ? (
                  <StoryReader title={material.title} body={material.body} glosses={topic.glosses} />
                ) : (
                  <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">{material.body}</div>
                )}
                {material.keyPoints.length > 0 ? (
                  <ul className="space-y-1 border-t border-slate-200 pt-3">
                    {material.keyPoints.map((point) => (
                      <li key={point} className="text-xs text-slate-600 flex gap-2">
                        <span aria-hidden="true" className="text-indigo-600">
                          →
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}

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
