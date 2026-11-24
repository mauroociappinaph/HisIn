"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { LessonDTO } from "@/shared/types";
import { LevelBadge } from "@/components/vocab-ui";
import { describeDesign, type ClassDesign } from "@/modules/classroom/design";
import { parseLessonContent } from "@/modules/lessons/structure";
import { resolveLevel } from "@/shared/lib/presentation";

export default function LessonsPage() {
  const params = useParams();
  const moduleSlug = params.module as string;

  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [level, setLevel] = useState<string>("B1");
  const [requestedLevel, setRequestedLevel] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const [designLine, setDesignLine] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/lessons?module=${moduleSlug}`).then((response) => response.json()),
      fetch("/api/progress").then((response) => response.json()),
      fetch("/api/class").then((response) => response.json()),
    ])
      .then(([all, progress, classroom]: [LessonDTO[], { profile: { level: string }; completedLessonIds: string[] }, { design: ClassDesign }]) => {
        if (active) setDesignLine(describeDesign(classroom.design));
        return [all, progress] as [LessonDTO[], { profile: { level: string }; completedLessonIds: string[] }];
      })
      .then(([all, progress]: [LessonDTO[], { profile: { level: string }; completedLessonIds: string[] }]) => {
        if (!active) return;
        const target = resolveLevel(progress.profile.level as never, [
          ...new Set(all.map((lesson) => lesson.level)),
        ]);
        const chosen = target ?? (progress.profile.level as string);
        setLevel(chosen);
        setRequestedLevel(chosen !== progress.profile.level ? progress.profile.level : null);
        setLessons(all.filter((lesson) => lesson.level === chosen));
        setCompleted(progress.completedLessonIds);
      })
      .catch(() => {
        if (active) setLessons([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [moduleSlug]);

  const complete = useCallback(
    async (lessonId: string) => {
      setCompleted((previous) => (previous.includes(lessonId) ? previous : [...previous, lessonId]));
      await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "lesson", lessonId, items: 1, xp: 15 }),
      });
    },
    [],
  );

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/learn" className="hover:text-indigo-600">
          Aprender
        </Link>
        <span aria-hidden="true">/</span>
        <span className="capitalize text-slate-700">{moduleSlug}</span>
      </nav>

      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold capitalize text-slate-900">{moduleSlug} — Lecciones</h1>
        <div className="flex items-center gap-2">
          <LevelBadge level={level as never} />
          {designLine ? (
            <Link
              href={`/class?tema=${encodeURIComponent(moduleSlug)}`}
              className="text-[11px] px-2 py-1 rounded-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
              title="Contexto de clase con el que se diseñan las sesiones"
            >
              {designLine}
            </Link>
          ) : null}
        </div>
      </header>

      {requestedLevel ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-4 py-2">
          No hay lecciones {requestedLevel} todavía; estás viendo lecciones {level}.
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-16 rounded-lg bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="rounded-lg bg-white border border-slate-200 p-8 text-center space-y-2">
          <p className="font-medium text-slate-700">No hay lecciones para este módulo todavía.</p>
          <p className="text-sm text-slate-500">Podés generar contenido nuevo o practicar con lo que ya hay.</p>
          <div className="flex justify-center gap-2 pt-2">
            <Link
              href="/studio"
              className="px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Generar lecciones
            </Link>
            <Link
              href={`/practice/${moduleSlug}`}
              className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
            >
              Practicar
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const isDone = completed.includes(lesson.id);
            const sections = parseLessonContent(lesson.content);
            return (
              <article key={lesson.id} className="bg-white rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpen(open === lesson.id ? null : lesson.id)}
                  aria-expanded={open === lesson.id}
                  className="w-full text-left p-4 flex justify-between items-center gap-3"
                >
                  <span className="font-semibold text-slate-800">{lesson.title}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {isDone ? <span className="text-xs text-emerald-600 font-semibold">✓ vista</span> : null}
                    <LevelBadge level={lesson.level} />
                  </span>
                </button>
                {open === lesson.id ? (
                  <div className="p-4 border-t border-slate-200 space-y-3">
                    <p className="text-sm text-slate-600">{lesson.summary}</p>
                    {sections.length > 0 ? (
                      <div className="space-y-3">
                        {sections.map((section) => (
                          <section key={section.key} className="space-y-1">
                            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {section.label}
                            </h3>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                              {section.body}
                            </p>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">{lesson.content}</div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void complete(lesson.id)}
                        disabled={isDone}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-sm text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isDone ? "Ya la marcaste" : "Marcar como vista"}
                      </button>
                      <Link
                        href={`/class?tema=${encodeURIComponent(lesson.title)}`}
                        className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
                      >
                        Diseñar la clase
                      </Link>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
