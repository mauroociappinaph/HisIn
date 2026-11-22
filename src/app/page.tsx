import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/shared/db/prisma";
import { TopicRepository } from "@/modules/topics/repository";
import { SKILL_LABELS } from "@/modules/topics/schema";
import { getLocalUser } from "@/modules/identity/service";
import { ProgressRepository } from "@/modules/progress/repository";
import { goalRatio, nextAction } from "@/modules/progress/service";
import { getDueReviews } from "@/modules/vocabulary/srs";
import { Onboarding } from "@/components/onboarding";
import { ContextBar } from "@/components/context-bar";
import { ProgressBar } from "@/app/review/vocab/_components/ui";

async function HomeContent() {
  const user = await getLocalUser();
  const progress = new ProgressRepository();
  const profile = await progress.getProfile(user.id);

  if (!profile.onboarded) {
    return <Onboarding defaultLevel={profile.level} />;
  }

  const topics = await new TopicRepository().list();

  const [due, stories, completed, lessons, moduleRows] = await Promise.all([
    getDueReviews(user.id, 50),
    prisma.vocabularyStory.count(),
    progress.completedLessonIds(user.id),
    prisma.lesson.findMany({
      where: { level: profile.level },
      orderBy: [{ module: "asc" }, { order: "asc" }],
      select: { id: true, module: true, title: true, level: true },
      take: 20,
    }),
    prisma.module.findMany({ orderBy: { order: "asc" } }),
  ]);

  // Submodules: each course module with how many lessons it holds.
  const allLessons = await prisma.lesson.findMany({ select: { module: true } });
  const modules = moduleRows.map((subject) => ({
    slug: subject.slug,
    name: subject.name,
    description: subject.description,
    lessonCount: allLessons.filter((lesson) => lesson.module === subject.slug).length,
  }));

  const nextLesson = lessons.find((lesson) => !completed.includes(lesson.id)) ?? null;
  const action = nextAction({
    dueReviews: due.length,
    itemsToday: profile.itemsToday,
    dailyGoal: profile.dailyGoal,
    hasStory: stories > 0,
    nextLessonHref: nextLesson ? `/lessons/${nextLesson.module}` : "/learn",
  });
  const ratio = goalRatio(profile.itemsToday, profile.dailyGoal);

  return (
    <div className="space-y-6">
      <ContextBar
        initial={{
          discipline: profile.classDesign.discipline,
          educationLevel: profile.classDesign.educationLevel,
          minutes: profile.classDesign.minutes,
          sequence: profile.classDesign.sequence,
        }}
      />

      <section className="rounded-lg bg-white border border-slate-200 p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Hoy</h1>
            <p className="text-sm text-slate-600">
              Nivel {profile.level} · {profile.goal === "interviews" ? "entrevistas técnicas" : profile.goal}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1.5 rounded-sm bg-amber-50 text-amber-700 font-semibold">
              🔥 {profile.streak} {profile.streak === 1 ? "día" : "días"}
            </span>
            <span className="px-3 py-1.5 rounded-sm bg-indigo-50 text-indigo-700 font-semibold">
              ⚡ {profile.xp} XP
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {profile.itemsToday} de {profile.dailyGoal} tarjetas hoy
            </span>
            <span>{Math.round(ratio * 100)}%</span>
          </div>
          <ProgressBar value={ratio * 100} />
        </div>
      </section>

      <Link
        href={action.href}
        className="block rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-6 shadow-md hover:shadow-lg transition"
      >
        <span className="text-[11px] uppercase tracking-widest text-white/75">Tu próxima acción</span>
        <h2 className="text-2xl font-bold mt-1">{action.title}</h2>
        <p className="text-white/85 text-sm mt-1 max-w-xl">{action.reason}</p>
        <span className="inline-block mt-4 px-4 py-2 rounded-sm bg-white/20 font-semibold text-sm">
          Empezar →
        </span>
      </Link>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-800">Temas del curso</h2>
          <span className="text-[11px] text-slate-500">temario oficial, material generado por Gentleman Shell</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="rounded-lg bg-white border border-slate-200 p-4 space-y-2 hover:border-indigo-300 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Tema {topic.order}
                </span>
                <span className="text-[11px] text-slate-500">{topic.level}</span>
              </div>
              <h3 className="font-semibold text-slate-900 leading-tight">{topic.title}</h3>
              <p className="text-[11px] text-slate-500">
                {topic.materials.length === 0
                  ? "Sin material todavía: se genera con el motor"
                  : topic.materials.map((material) => SKILL_LABELS[material.skill]).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-slate-800">Módulos y submódulos</h2>
          <Link href="/modules" className="text-xs font-semibold text-indigo-600 hover:underline">
            Ver recorridos de estudio (4 pasos) →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map((subject) => (
            <article key={subject.slug} className="rounded-lg bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{subject.name}</h3>
                  <p className="text-[11px] text-slate-500">{subject.description}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  {subject.lessonCount} lecciones
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <Link
                  href={`/lessons/${subject.slug}`}
                  className="px-3 py-1.5 rounded-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                >
                  Lecciones
                </Link>
                <Link
                  href={`/practice/${subject.slug}`}
                  className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Practicar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/review/vocab"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            🧠
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Repaso espaciado</h3>
          <p className="text-xs text-slate-500">
            {due.length} {due.length === 1 ? "tarjeta pendiente" : "tarjetas pendientes"} · SM-2
          </p>
        </Link>
        <Link
          href="/review/vocab?modo=historias"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            📖
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Historias</h3>
          <p className="text-xs text-slate-500">{stories} relatos generados con audio y traducción</p>
        </Link>
        <Link
          href="/phrasal-verbs"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            🧩
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Phrasal verbs</h3>
          <p className="text-xs text-slate-500">por partícula, con separabilidad y registro</p>
        </Link>
        <Link
          href="/patterns"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            🏗️
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Patrones</h3>
          <p className="text-xs text-slate-500">estructura + función + error típico</p>
        </Link>
        <Link
          href="/modules"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            🧭
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Módulos de estudio</h3>
          <p className="text-xs text-slate-500">leer, gramática, práctica y repaso en un recorrido</p>
        </Link>
        <Link
          href="/grammar"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            📐
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Gramática</h3>
          <p className="text-xs text-slate-500">present perfect, pasado y compañía: dónde se usa cada tiempo</p>
        </Link>
        <Link
          href="/news"
          className="rounded-lg bg-white border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <span className="text-2xl" aria-hidden="true">
            📰
          </span>
          <h3 className="font-semibold text-slate-800 mt-1">Noticias</h3>
          <p className="text-xs text-slate-500">lectura real, analizada palabra por palabra</p>
        </Link>
      </section>

      <p className="text-xs text-slate-400">
        Sin niveles bloqueados: elegí cualquier tema cuando quieras.{" "}
        <Link href="/learn" className="text-indigo-600 hover:underline">
          Ver todo
        </Link>
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="space-y-3" aria-busy="true">
      <div className="h-24 rounded-lg bg-white border border-slate-200 animate-pulse" />
      <div className="h-40 rounded-lg bg-white border border-slate-200 animate-pulse" />
    </div>}>
      <HomeContent />
    </Suspense>
  );
}
