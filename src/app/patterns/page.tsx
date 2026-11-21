"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { VocabularyDTO } from "@/shared/types";
import { EntryForm } from "@/components/entry-form";
import { LevelBadge, ModuleTag, SpeakButton } from "@/components/vocab-ui";

/** What each function does in a sentence, in the learner's terms. */
const FUNCTION_MEANINGS: Record<string, string> = {
  hedge: "no comprometerse del todo (might, it seems)",
  soften: "suavizar algo incómodo (I'm afraid, would you mind)",
  persuade: "empujar una decisión (make + objeto + verbo)",
  report: "contar lo que otro dijo o hizo (is said to, was reported)",
  compare: "medir dos cosas (twice as, compared with)",
};


export default function PatternsPage() {
  const [entries, setEntries] = useState<VocabularyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [fn, setFn] = useState<string>("all");

  useEffect(() => {
    let active = true;
    fetch("/api/vocabulary?kind=PATTERN")
      .then((response) => response.json())
      .then((data: VocabularyDTO[]) => {
        if (active) setEntries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setEntries([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const functionCounts = useMemo(() => {
    const seen = new Map<string, number>();
    for (const entry of entries) {
      const key = entry.function ?? "unclassified";
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const visible = useMemo(
    () => (fn === "all" ? entries : entries.filter((entry) => (entry.function ?? "unclassified") === fn)),
    [entries, fn],
  );

  const remove = useCallback(async (entry: VocabularyDTO) => {
    if (!window.confirm(`¿Borrar "${entry.term}" de tus patrones?`)) return;
    const response = await fetch(`/api/vocabulary/${entry.id}`, { method: "DELETE" });
    if (response.ok) {
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
    }
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-5 md:p-6 shadow-lg shadow-sky-600/20">
        <span className="text-[11px] uppercase tracking-widest text-white/75">Estructura antes que palabra</span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Patrones</h1>
        <p className="text-white/85 max-w-2xl text-sm mt-1">
          Una estructura con slots y una función: qué comunica, no solo cómo se traduce. Aprender el patrón te deja
          reusar cien palabras en lugar de memorizar cien oraciones.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFn("all")}
            aria-pressed={fn === "all"}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              fn === "all" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            Todos ({entries.length})
          </button>
          {functionCounts.map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFn(key)}
              aria-pressed={fn === key}
              title={FUNCTION_MEANINGS[key] ?? "sin función asignada"}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                fn === key ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {key === "unclassified" ? "sin clasificar" : key} ({count})
            </button>
          ))}
        </div>
        <EntryForm
          kinds={["PATTERN"]}
          defaultModule="grammar"
          onCreated={(entry) => setEntries((previous) => [entry, ...previous])}
        />
      </div>

      {fn !== "all" && FUNCTION_MEANINGS[fn] ? (
        <p className="text-sm text-slate-600 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2">
          <span className="font-semibold">{fn}</span>: {FUNCTION_MEANINGS[fn]}.
        </p>
      ) : null}

      {loading ? (
        <p className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
          Cargando patrones…
        </p>
      ) : visible.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <p className="text-slate-700 font-medium">Todavía no hay patrones para mostrar.</p>
          <p className="text-sm text-slate-500">
            Agregá uno arriba — por ejemplo <span className="font-mono">make + object + verb</span> — o generá
            contenido en{" "}
            <Link href="/studio" className="text-indigo-600 hover:underline">
              /studio
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-sky-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <LevelBadge level={entry.level} />
                  <ModuleTag module={entry.module} />
                  {entry.function ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-700">
                      {entry.function}
                    </span>
                  ) : null}
                  {entry.source === "USER" ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      propia
                    </span>
                  ) : null}
                </div>
                <SpeakButton text={entry.example} label={`Escuchar un ejemplo de ${entry.term}`} />
              </div>

              <h2 className="text-lg font-mono font-bold text-slate-900 break-words">{entry.term}</h2>
              <p className="text-sm text-slate-700">{entry.definition}</p>
              <p className="text-sm italic text-slate-500 border-l-2 border-sky-200 pl-3">{entry.example}</p>

              {entry.notes ? (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ Error típico: {entry.notes}
                </p>
              ) : null}

              {entry.source === "USER" ? (
                <button
                  type="button"
                  onClick={() => void remove(entry)}
                  className="mt-auto self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Borrar
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
