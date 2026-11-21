"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LevelBadge, ModuleTag, ProgressBar, SpeakButton } from "./ui";
import type { TrainerMode, VocabReviewItem } from "./types";

interface ReviewModeProps {
  loading: boolean;
  items: VocabReviewItem[];
  onGrade: (vocabularyId: string, quality: number) => Promise<void>;
  onReload: () => Promise<void>;
  onSwitchMode: (mode: TrainerMode) => void;
}

const GRADES = [
  { quality: 0, label: "Nada", tone: "bg-rose-600 hover:bg-rose-700" },
  { quality: 1, label: "Muy difícil", tone: "bg-rose-500 hover:bg-rose-600" },
  { quality: 2, label: "Difícil", tone: "bg-orange-500 hover:bg-orange-600" },
  { quality: 3, label: "Con esfuerzo", tone: "bg-amber-500 hover:bg-amber-600" },
  { quality: 4, label: "Fácil", tone: "bg-lime-600 hover:bg-lime-700" },
  { quality: 5, label: "Perfecto", tone: "bg-emerald-600 hover:bg-emerald-700" },
] as const;

export function ReviewMode({ loading, items, onGrade, onReload, onSwitchMode }: ReviewModeProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState({ graded: 0, recalled: 0 });
  const [finished, setFinished] = useState(false);

  const current = items[index];

  const grade = useCallback(
    async (quality: number) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        await onGrade(current.vocabulary.id, quality);
        setSession((previous) => ({
          graded: previous.graded + 1,
          recalled: previous.recalled + (quality >= 3 ? 1 : 0),
        }));
        if (index < items.length - 1) {
          setIndex((value) => value + 1);
          setRevealed(false);
        } else {
          setFinished(true);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, current, index, items.length, onGrade],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!current || finished) return;
      if (!revealed && (event.code === "Space" || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && /^[0-5]$/.test(event.key)) {
        event.preventDefault();
        void grade(Number(event.key));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, finished, grade, revealed]);

  async function restart() {
    setIndex(0);
    setRevealed(false);
    setFinished(false);
    setSession({ graded: 0, recalled: 0 });
    await onReload();
  }

  if (loading) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
        Cargando repaso…
      </div>
    );
  }

  if (items.length === 0 || !current) {
    return (
      <div className="space-y-5">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">
            🌱
          </div>
          <h3 className="text-xl font-bold text-slate-800">No hay palabras para repasar ahora</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            El algoritmo SM-2 ya programó todo lo que sabías. Mientras vuelve a estar disponible, explorá el banco
            o jugá un desafío rápido.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSwitchMode("explore")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Explorar vocabulario
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode("challenge")}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-medium hover:border-indigo-300 hover:text-indigo-600 transition"
          >
            Desafío rápido
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-medium hover:border-indigo-300 hover:text-indigo-600 transition"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (finished) {
    const accuracy = session.graded === 0 ? 0 : Math.round((session.recalled / session.graded) * 100);
    return (
      <div className="space-y-5">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">
            ✅
          </div>
          <h3 className="text-2xl font-bold">Sesión completada</h3>
          <p className="text-white/85 text-sm">
            Repasaste {session.graded} {session.graded === 1 ? "palabra" : "palabras"} con {accuracy}% de
            recuerdo. El SM-2 ya reprogramó cada una.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void restart()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Ver si hay más
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode("challenge")}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-medium hover:border-indigo-300 hover:text-indigo-600 transition"
          >
            Cerrar con un desafío
          </button>
        </div>
      </div>
    );
  }

  const vocabulary = current.vocabulary;
  const progress = ((index + 1) / items.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Tarjeta {index + 1} de {items.length}
        </span>
        <span className="font-mono text-xs">
          EF {current.easeFactor.toFixed(2)} · {current.repetitions} reps · {current.interval}d
        </span>
      </div>
      <ProgressBar value={progress} />

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-7 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <LevelBadge level={vocabulary.level} />
              <ModuleTag module={vocabulary.module} />
            </div>
            <SpeakButton text={vocabulary.term} label={`Escuchar ${vocabulary.term}`} />
          </div>

          <h3 className="text-3xl font-bold text-slate-900 break-words">{vocabulary.term}</h3>

          {revealed ? (
            <div className="space-y-3 pt-1">
              <p className="text-slate-700">{vocabulary.definition}</p>
              <p className="text-sm italic text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
                {vocabulary.example}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              ¿Recordás qué significa? Intentá decirlo en voz alta antes de dar vuelta la tarjeta.
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-4">
          {revealed ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                ¿Qué tan fácil fue recordarlo? (0–5)
              </p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {GRADES.map(({ quality, label, tone }) => (
                  <button
                    key={quality}
                    type="button"
                    disabled={busy}
                    onClick={() => void grade(quality)}
                    className={`px-2 py-2 rounded-xl text-white text-xs font-semibold transition disabled:opacity-50 ${tone}`}
                  >
                    <span className="block text-base leading-none">{quality}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
            >
              Mostrar respuesta
              <span aria-hidden="true" className="ml-2 text-xs font-normal text-white/70">
                espacio
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
