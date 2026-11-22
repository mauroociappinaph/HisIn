import Link from "next/link";
import { Suspense } from "react";
import { LevelBadge } from "@/components/vocab-ui";
import { TopicRepository } from "@/modules/topics/repository";
import { SKILL_LABELS, type TopicSkill } from "@/modules/topics/schema";
import { GenerateMaterials } from "./generate-materials";
import { StoryReader } from "./story-reader";

async function TopicBody({ slug }: { slug: string }) {
  const topic = await new TopicRepository().findBySlug(slug);

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

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
        <Link href="/" className="hover:text-indigo-600">
          Módulos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">Tema {topic.code ?? topic.order}</span>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
            Tema {topic.code ?? topic.order}
          </span>
          <LevelBadge level={topic.level} />
          {topic.focus ? <span className="text-xs text-slate-500">{topic.focus}</span> : null}
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{topic.title}</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Cuatro materiales del mismo tema, todos en contexto healthtech y Silicon Valley: la regla, un texto, un
          diálogo y una tarea de escritura.
        </p>
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
        <div className="space-y-4">
          {topic.materials.map((material) => (
            <article key={material.skill} className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">
                  {SKILL_LABELS[material.skill as TopicSkill]}
                </span>
                <span className="text-[11px] text-slate-400">{material.title}</span>
              </div>
              {material.skill === "STORY" ? (
                <StoryReader title={material.title} body={material.body} />
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
