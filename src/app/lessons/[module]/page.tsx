"use client";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { LessonDTO } from "@/shared/types";

function LessonsInner() {
  const params = useParams();
  const module = params.module as string;
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [level, setLevel] = useState<string>("B1");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const l = localStorage.getItem("hisin_level") ?? "B1";
    setLevel(l);
    fetch(`/api/lessons?module=${module}&level=${l}`)
      .then((r) => r.json())
      .then(setLessons);
  }, [module]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold capitalize">{module} — Lecciones ({level})</h2>
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
