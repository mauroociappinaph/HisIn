import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { ProgressRepository } from "@/modules/progress/repository";
import { goalRatio } from "@/modules/progress/service";
import { ProgressBar } from "@/app/review/vocab/_components/ui";
import { StudyPrefs } from "@/components/study-prefs";

/**
 * Progress reads Postgres, not localStorage: the numbers survive a cleared
 * browser, which is the whole point of moving them.
 */
async function ProgressContent() {
  const user = await getLocalUser();
  const repository = new ProgressRepository();
  const [profile, completed, reviews, words, stories] = await Promise.all([
    repository.getProfile(user.id),
    repository.completedLessonIds(user.id),
    prisma.vocabularyReview.findMany({ where: { userId: user.id } }),
    prisma.vocabulary.count(),
    prisma.vocabularyStory.count(),
  ]);

  const mature = reviews.filter((review) => review.interval >= 21).length;
  const accuracy = profile.totalItems === 0 ? 0 : Math.round((profile.totalCorrect / profile.totalItems) * 100);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Progreso</h1>
        <p className="text-sm text-slate-600">Todo lo que ves acá está guardado en la base.</p>
      </header>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Meta de hoy</span>
          <span className="font-semibold text-slate-800">
            {profile.itemsToday} / {profile.dailyGoal}
          </span>
        </div>
        <ProgressBar value={goalRatio(profile.itemsToday, profile.dailyGoal) * 100} />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "XP total", value: profile.xp },
          { label: "Racha actual", value: `${profile.streak} d` },
          { label: "Mejor racha", value: `${profile.bestStreak} d` },
          { label: "Precisión", value: `${accuracy}%` },
          { label: "Tarjetas hechas", value: profile.totalItems },
          { label: "Palabras maduras", value: mature },
          { label: "Lecciones vistas", value: completed.length },
          { label: "Banco", value: `${words} palabras · ${stories} historias` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-sm bg-white border border-slate-200 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{stat.label}</div>
            <div className="text-xl font-bold text-slate-800">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-2">
        <h2 className="font-semibold text-slate-800">Qué hacer con esto</h2>
        <p className="text-sm text-slate-600">
          La precisión sólo dice algo si seguís practicando lo que te cuesta: el repaso espaciado elige por vos.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/review/vocab"
            className="px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Repasar ahora
          </Link>
          <Link
            href="/learn"
            className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
          >
            Elegir un tema
          </Link>
        </div>
      </section>

      <StudyPrefs />
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={<div className="space-y-3" aria-busy="true">
      <div className="h-24 rounded-lg bg-white border border-slate-200 animate-pulse" />
      <div className="h-40 rounded-lg bg-white border border-slate-200 animate-pulse" />
    </div>}>
      <ProgressContent />
    </Suspense>
  );
}