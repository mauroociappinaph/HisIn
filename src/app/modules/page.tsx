import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { ProgressRepository } from "@/modules/progress/repository";
import { LevelBadge } from "@/components/vocab-ui";
import { describeDesign, type ClassDesign } from "@/modules/classroom/design";
import { buildStudyModule, moduleProgress } from "@/modules/study/plan";

/** The grammar topic that unlocks the output of each module. */
const GRAMMAR_BY_MODULE: Record<string, string[]> = {
  vocabulary: ["present-perfect-vs-past-simple"],
  reading: ["passive-voice"],
  listening: ["past-simple"],
  "business-english": ["future-forms"],
  contracts: ["passive-voice"],
  grammar: ["conditionals"],
};

const SKILL_BY_MODULE: Record<string, string> = {
  vocabulary: "VOCABULARY",
  reading: "READING",
  listening: "LISTENING",
  "business-english": "BUSINESS",
  contracts: "CONTRACTS",
  grammar: "GRAMMAR",
};

async function ModulesContent() {
  const user = await getLocalUser();
  const progress = new ProgressRepository();
  const profile = await progress.getProfile(user.id);
  const completed = await progress.completedLessonIds(user.id);

  const [modules, lessons, vocabByModule, questionsBySkill, stories] = await Promise.all([
    prisma.module.findMany({ orderBy: { order: "asc" } }),
    prisma.lesson.findMany({ select: { id: true, module: true } }),
    prisma.vocabulary.groupBy({ by: ["module"], _count: { _all: true } }),
    prisma.question.groupBy({ by: ["skill"], _count: { _all: true } }),
    prisma.vocabularyStory.count(),
  ]);

  const design: ClassDesign = {
    discipline: profile.classDesign.discipline as ClassDesign["discipline"],
    educationLevel: profile.classDesign.educationLevel as ClassDesign["educationLevel"],
    educationMix: (profile.classDesign.educationMix as ClassDesign["educationMix"]) ?? undefined,
    minutes: profile.classDesign.minutes as ClassDesign["minutes"],
    sequence: profile.classDesign.sequence as ClassDesign["sequence"],
  };

  // `module` is a reserved name in the bundler, so the rows are called `subject`.
  const vocabCount = (slug: string) => vocabByModule.find((row) => row.module === slug)?._count._all ?? 0;
  const questionCount = (slug: string) =>
    questionsBySkill.find((row) => row.skill === SKILL_BY_MODULE[slug])?._count._all ?? 0;

  const studyModules = modules.map((subject) => {
    const lessonIds = lessons.filter((lesson) => lesson.module === subject.slug).map((l) => l.id);
    const plan = buildStudyModule({
      slug: subject.slug,
      title: subject.name,
      objective: subject.description,
      level: profile.level as never,
      minutes: design.minutes,
      grammarSlugs: GRAMMAR_BY_MODULE[subject.slug] ?? [],
      hasStories: stories > 0,
      vocabCount: vocabCount(subject.slug),
      questionCount: questionCount(subject.slug),
    });
    return { plan, done: moduleProgress(completed, lessonIds), lessons: lessonIds.length };
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Módulos de estudio</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Cada módulo es un recorrido de cuatro pasos que entra en tu clase: leer, revisar la estructura,
          practicar y volver a las 48 horas. {describeDesign(design)}.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {studyModules.map(({ plan, done, lessons: lessonCount }) => (
          <article key={plan.slug} className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-slate-900">{plan.title}</h2>
                <p className="text-xs text-slate-500">{plan.objective}</p>
              </div>
              <div className="flex items-center gap-2">
                <LevelBadge level={plan.level} />
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {plan.minutes} min
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {lessonCount} {lessonCount === 1 ? "lección" : "lecciones"}
                </span>
                <span>{done}% del módulo leído</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-indigo-600" style={{ width: `${done}%` }} />
              </div>
            </div>

            <ol className="space-y-1">
              {plan.steps.map((step, index) => (
                <li key={step.id}>
                  <Link
                    href={step.href}
                    className="flex items-start justify-between gap-3 rounded-sm px-3 py-2 hover:bg-indigo-50 transition group"
                  >
                    <span className="flex items-start gap-2">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                          {step.title}
                        </span>
                        <span className="block text-[11px] text-slate-500">{step.detail}</span>
                      </span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">{step.minutes} min</span>
                  </Link>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        ¿Querés armar una clase con este módulo?{" "}
        <Link href="/class" className="text-indigo-600 hover:underline">
          Diseñar una clase
        </Link>
        .
      </p>
    </div>
  );
}

export default function ModulesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3" aria-busy="true">
          <div className="h-20 rounded-lg bg-white border border-slate-200 animate-pulse" />
          <div className="h-64 rounded-lg bg-white border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <ModulesContent />
    </Suspense>
  );
}
