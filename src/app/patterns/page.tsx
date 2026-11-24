"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { VocabularyDTO } from "@/shared/types";
import { EntryForm } from "@/components/entry-form";
import { LevelBadge, ModuleTag, SpeakButton } from "@/components/vocab-ui";
import { ChipsLegend } from "@/components/chips-legend";
import { PATTERN_FUNCTION_MEANINGS as FUNCTION_MEANINGS, patternSectionViews } from "@/modules/vocabulary/patterns";


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

  const filtered = useMemo(
    () => (fn === "all" ? entries : entries.filter((entry) => (entry.function ?? "unclassified") === fn)),
    [entries, fn],
  );
  const [shown, setShown] = useState(12);
  const visible = filtered.slice(0, shown);

  /** Corrige la función que el motor pudo haber etiquetado mal. */
  const fixFunction = useCallback(async (entry: VocabularyDTO, value: string) => {
    const next = value === "" ? null : value;
    const response = await fetch(`/api/vocabulary/${entry.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ function: next }),
    });
    if (!response.ok) return;
    setEntries((previous) =>
      previous.map((item) => (item.id === entry.id ? { ...item, function: next ?? undefined } : item)),
    );
  }, []);

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

      <ChipsLegend />

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

              {patternSectionViews(entry).map((section) => (
                <div key={section.key} className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {section.label}
                  </p>
                  <p
                    className={
                      section.key === "example" || section.key === "extraExample"
                        ? "text-sm italic text-slate-500 border-l-2 border-sky-200 pl-3"
                        : section.key === "notes"
                          ? "text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                          : "text-sm text-slate-700"
                    }
                  >
                    {section.value}
                  </p>
                </div>
              ))}

              {entry.source === "USER" ? (
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    Corregir función
                    <select
                      value={entry.function ?? ""}
                      onChange={(event) => void fixFunction(entry, event.target.value)}
                      className="px-2 py-1 rounded-sm border border-slate-300 bg-white text-xs"
                    >
                      <option value="">sin clasificar</option>
                      {Object.keys(FUNCTION_MEANINGS).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void remove(entry)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Borrar
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {!loading && shown < filtered.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown((value) => value + 12)}
            className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
          >
            Mostrar más ({filtered.length - shown} restantes)
          </button>
        </div>
      ) : null}
    </div>
  );
}
