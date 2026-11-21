"use client";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { CefrLevel, LessonDTO } from "@/shared/types";
import { resolveLevel } from "@/shared/lib/presentation";

function LessonsInner() {
  const params = useParams();
  const moduleSlug = params.module as string;
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [level, setLevel] = useState<string>("B1");
  const [requestedLevel, setRequestedLevel] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const storedLevel = (localStorage.getItem("hisin_level") ?? "B1") as CefrLevel;
      // The full module listing comes back at once so a level without lessons
      // can fall back to the closest available level, in the page.
      const data = (await fetch(`/api/lessons?module=${moduleSlug}`).then(
        (r) => r.json(),
      )) as LessonDTO[];
      if (!active) return;
      const target = resolveLevel(storedLevel, [...new Set(data.map((l) => l.level))]);
      setLevel(target ?? storedLevel);
      setRequestedLevel(target && target !== storedLevel ? storedLevel : null);
      setLessons(target ? data.filter((l) => l.level === target) : []);
    })();
    return () => {
      active = false;
    };
  }, [moduleSlug]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold capitalize">{moduleSlug} — Lecciones ({level})</h2>
      {requestedLevel && requestedLevel !== level && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          No hay lecciones {requestedLevel} todavía; estás viendo lecciones {level}.
        </p>
      )}
      {lessons.length === 0 && <p className="text-slate-500">No hay lecciones para este nivel.</p>}
      <div className="space-y-4">
        {lessons.map((l) => (
          <div key={l.id} className="bg-white rounded-xl border shadow-sm">
            <button
              onClick={() => setOpen(open === l.id ? null : l.id)}
              className="w-full text-left p-4 flex justify-between items-center"
            >
              <span className="font-semibold">{l.title}</span>
              <span className="text-xs text-slate-500">{l.level}</span>
            </button>
            {open === l.id && (
              <div className="p-4 border-t prose prose-sm max-w-none">
                <p className="text-slate-600 mb-3">{l.summary}</p>
                <div className="whitespace-pre-wrap text-slate-800">{l.content}</div>
                <button
                  onClick={() => {
                    const raw = localStorage.getItem("hisin_completed");
                    const arr = raw ? JSON.parse(raw) : [];
                    if (!arr.includes(l.id)) {
                      arr.push(l.id);
                      localStorage.setItem("hisin_completed", JSON.stringify(arr));
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm"
                >
                  Marcar como completada
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LessonsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando...</p>}>
      <LessonsInner />
    </Suspense>
  );
}
