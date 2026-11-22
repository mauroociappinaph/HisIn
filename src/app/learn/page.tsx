import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { ProgressRepository } from "@/modules/progress/repository";

/**
 * The "Aprender" hub: every way into the material, none of it locked.
 *
 * Modules keep their lessons and practice; grammar, patterns, phrasal verbs and
 * stories sit next to them so a learner chooses by what they need today rather
 * than by a numbered path they have to unlock.
 */
async function LearnContent() {
  const user = await getLocalUser();
  const progress = new ProgressRepository();
  const completed = await progress.completedLessonIds(user.id);

  const [modules, lessons, counts] = await Promise.all([
    prisma.module.findMany({ orderBy: { order: "asc" } }),
    prisma.lesson.findMany({ select: { id: true, module: true, level: true } }),
    Promise.all([
      prisma.vocabulary.count({ where: { kind: "PHRASAL_VERB" } }),
      prisma.vocabulary.count({ where: { kind: "PATTERN" } }),
      prisma.vocabularyStory.count(),
      prisma.vocabulary.count(),
    ]),
  ]);

  const [phrasalVerbs, patterns, stories, words] = counts;

  const rows = modules.map((module) => {
    const moduleLessons = lessons.filter((lesson) => lesson.module === module.slug);
    const done = moduleLessons.filter((lesson) => completed.includes(lesson.id)).length;
    return { ...module, lessons: moduleLessons.length, done };
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Aprender</h1>
        <p className="text-sm text-slate-600">
          Elegí por dónde entrar. Todo está disponible: los niveles ordenan, no bloquean.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/phrasal-verbs"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Phrasal verbs</h2>
          <p className="text-xs text-slate-500">{phrasalVerbs} entradas · por partícula, separabilidad y registro</p>
        </Link>
        <Link
          href="/patterns"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Patrones</h2>
          <p className="text-xs text-slate-500">{patterns} estructuras · fórmula, función y error típico</p>
        </Link>
        <Link
          href="/review/vocab?modo=historias"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Historias</h2>
          <p className="text-xs text-slate-500">{stories} relatos con audio y traducción</p>
        </Link>
        <Link
          href="/grammar"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Gramática</h2>
          <p className="text-xs text-slate-500">tiempos, estructuras y reglas: dónde se usa cada uno</p>
        </Link>
        <Link
          href="/class"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Diseñar una clase</h2>
          <p className="text-xs text-slate-500">contexto real: disciplina, nivel, duración y secuencia</p>
        </Link>
        <Link
          href="/news"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Noticias</h2>
          <p className="text-xs text-slate-500">inglés real de healthtech y startups, analizado por el motor</p>
        </Link>
        <Link
          href="/review/vocab"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <h2 className="font-semibold text-slate-800">Repaso espaciado</h2>
          <p className="text-xs text-slate-500">{words} entradas en tu banco · SM-2</p>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800">Módulos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((module) => (
            <article key={module.id} className="rounded-lg bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    <span aria-hidden="true" className="mr-1.5">
                      {module.icon}
                    </span>
                    {module.name}
                  </h3>
                  <p className="text-xs text-slate-500">{module.description}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  {module.done}/{module.lessons}
                </span>
              </div>
              <div className="flex gap-2 text-xs font-semibold">
                <Link
                  href={`/lessons/${module.slug}`}
                  className="px-3 py-1.5 rounded-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                >
                  Lecciones
                </Link>
                <Link
                  href={`/practice/${module.slug}`}
                  className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  Practicar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="space-y-3" aria-busy="true">
      <div className="h-24 rounded-lg bg-white border border-slate-200 animate-pulse" />
      <div className="h-40 rounded-lg bg-white border border-slate-200 animate-pulse" />
    </div>}>
      <LearnContent />
    </Suspense>
  );
}
