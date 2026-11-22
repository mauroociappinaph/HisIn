"use client";

import { useMemo, useState } from "react";
import type { VocabularyDTO } from "@/shared/types";
import { LevelBadge, ModuleTag, SpeakButton, KindTag, humanizeModule } from "./ui";
import { EntryForm } from "@/components/entry-form";

interface ExploreModeProps {
  bank: VocabularyDTO[];
  loading: boolean;
  recentlyMastered: Set<string>;
  onToggleMastered: (id: string) => void;
  onCreated: (entry: VocabularyDTO) => void;
}

export function ExploreMode({ bank, loading, recentlyMastered, onToggleMastered, onCreated }: ExploreModeProps) {
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const modules = useMemo(() => {
    const unique = Array.from(new Set(bank.map((item) => item.module))).sort();
    return ["all", ...unique];
  }, [bank]);

  const levels = useMemo(() => {
    const unique = Array.from(new Set(bank.map((item) => item.level))).sort();
    return ["all", ...unique];
  }, [bank]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bank.filter((item) => {
      const matchesModule = moduleFilter === "all" || item.module === moduleFilter;
      const matchesLevel = levelFilter === "all" || item.level === levelFilter;
      const matchesQuery =
        needle.length === 0 ||
        item.term.toLowerCase().includes(needle) ||
        item.definition.toLowerCase().includes(needle) ||
        item.example.toLowerCase().includes(needle);
      return matchesModule && matchesLevel && matchesQuery;
    });
  }, [bank, levelFilter, moduleFilter, query]);

  if (loading) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
        Cargando vocabulario…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar palabra, definición o ejemplo…"
          aria-label="Buscar en el vocabulario"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
        />
        <select
          value={moduleFilter}
          onChange={(event) => setModuleFilter(event.target.value)}
          aria-label="Filtrar por módulo"
          className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          {modules.map((module) => (
            <option key={module} value={module}>
              {module === "all" ? "Todos los módulos" : humanizeModule(module)}
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          aria-label="Filtrar por nivel"
          className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          {levels.map((level) => (
            <option key={level} value={level}>
              {level === "all" ? "Todos los niveles" : level}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {visible.length} de {bank.length} entradas
        </p>
        <EntryForm kinds={["WORD"]} onCreated={onCreated} />
      </div>

      {visible.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
          Ninguna palabra coincide con esos filtros.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => {
            const mastered = recentlyMastered.has(item.id);
            return (
              <article
                key={item.id}
                className="group flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <LevelBadge level={item.level} />
                    <ModuleTag module={item.module} />
                    <KindTag kind={item.kind} />
                  </div>
                  <SpeakButton text={item.term} label={`Escuchar ${item.term}`} />
                </div>

                <h3 className="text-xl font-bold text-slate-900 break-words">{item.term}</h3>
                <p className="text-sm text-slate-700">{item.definition}</p>
                <p className="text-sm italic text-slate-500 border-l-2 border-indigo-200 pl-3">
                  {item.example}
                </p>

                <button
                  type="button"
                  onClick={() => onToggleMastered(item.id)}
                  aria-pressed={mastered}
                  className={`mt-auto self-start px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    mastered
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mastered ? "✓ La sé" : "Marcar como sabida"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
