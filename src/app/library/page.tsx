"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabularyDTO } from "@/shared/types";
import { KIND_LABELS, KindTag, LevelBadge, ModuleTag, SpeakButton } from "@/components/vocab-ui";

interface SearchHit {
  id: string;
  title: string;
  href: string;
  meta: string | null;
  level: string | null;
  preview: string;
  score: number;
}

interface SearchGroup {
  kind: string;
  label: string;
  hits: SearchHit[];
}

const KINDS = ["all", "WORD", "PHRASAL_VERB", "PATTERN", "IDIOM"] as const;
const FUNCTIONS = ["hedge", "soften", "persuade", "report", "compare", "express"] as const;

/**
 * Mi vocabulario: everything saved, searchable, with the owner's entries
 * editable. Words, chunks and patterns in one list, because that is what the
 * learner actually has.
 */
export default function LibraryPage() {
  const [entries, setEntries] = useState<VocabularyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [shown, setShown] = useState(20);
  // The same box searches the whole course, not only the saved words: lessons,
  // story terms, mistakes and news come back ranked next to your own entries.
  const [results, setResults] = useState<SearchGroup[] | null>(null);
  const [expanded, setExpanded] = useState<string[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/vocabulary/all")
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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesKind = kind === "all" || entry.kind === kind;
      const matchesText =
        needle.length === 0 ||
        entry.term.toLowerCase().includes(needle) ||
        entry.definition.toLowerCase().includes(needle) ||
        entry.example.toLowerCase().includes(needle);
      return matchesKind && matchesText;
    });
  }, [entries, kind, query]);

  useEffect(() => {
    const term = query.trim();
    let active = true;

    // Every setState lives inside the timer callback: the effect only schedules
    // work and subscribes, which is what the lint rule asks for.
    const timer = setTimeout(() => {
      if (term.length < 2) {
        setResults(null);
        setSearching(false);
        return;
      }

      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(term)}`)
        .then((response) => response.json())
        .then((data: { groups?: SearchGroup[]; expanded?: { keywords: string[] } | null }) => {
          if (active) {
            setResults(data.groups ?? []);
            setExpanded(data.expanded?.keywords ?? null);
          }
        })
        .catch(() => {
          if (active) setResults([]);
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);


  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/vocabulary/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as VocabularyDTO;
    setEntries((previous) => previous.map((entry) => (entry.id === id ? { ...entry, ...updated } : entry)));
  }, []);

  const remove = useCallback(async (entry: VocabularyDTO) => {
    if (!window.confirm(`¿Borrar "${entry.term}" de tu vocabulario?`)) return;
    const response = await fetch(`/api/vocabulary/${entry.id}`, { method: "DELETE" });
    if (response.ok) setEntries((previous) => previous.filter((item) => item.id !== entry.id));
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) map.set(entry.kind, (map.get(entry.kind) ?? 0) + 1);
    return map;
  }, [entries]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Mi vocabulario</h1>
        <p className="text-sm text-slate-600">
          {entries.length} entradas: palabras, phrasal verbs, expresiones y patrones. Todo entra al repaso espaciado.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={kind === option}
            onClick={() => {
              setKind(option);
              setShown(20);
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
              kind === option
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {option === "all" ? `Todo (${entries.length})` : `${KIND_LABELS[option]} (${counts.get(option) ?? 0})`}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setShown(20);
        }}
        placeholder="Buscar en todo el curso: una palabra, una regla, una duda…"
        aria-label="Buscar en todo el curso"
        className="w-full px-4 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />

      {searching ? <p className="text-xs text-slate-500">Buscando en lecciones, términos y errores…</p> : null}

      {results && results.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4">
          <p className="text-[11px] uppercase tracking-widest text-indigo-700">En todo el curso</p>
          {expanded && expanded.length > 0 ? (
            <p className="text-[11px] text-slate-500">
              Buscamos también: {expanded.join(" · ")}
            </p>
          ) : null}
          {results.map((group) => (
            <div key={group.kind} className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-600">{group.label}</p>
              <ul className="space-y-1">
                {group.hits.slice(0, 4).map((hit) => (
                  <li key={hit.id}>
                    <a
                      href={hit.href}
                      className="flex flex-wrap items-baseline gap-2 rounded-sm bg-white px-3 py-2 text-sm text-slate-800 hover:border-indigo-300 border border-transparent"
                    >
                      <span className="font-medium">{hit.title}</span>
                      {hit.level ? <span className="text-[10px] text-slate-500">{hit.level}</span> : null}
                      {hit.meta ? (
                        <span className="truncate text-[11px] text-slate-500">{hit.meta}</span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {results && results.length === 0 && query.trim().length >= 2 ? (
        <p className="text-xs text-slate-500">
          Nada en el curso con esas palabras. Probá con el término en inglés.
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-20 rounded-lg bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg bg-white border border-slate-200 p-8 text-center space-y-2">
          <p className="font-medium text-slate-700">Nada por acá todavía.</p>
          <p className="text-sm text-slate-500">
            Usá el botón <strong>＋</strong> para agregar una palabra o frase: el motor la clasifica y la guarda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, shown).map((entry) => (
            <article key={entry.id} className="rounded-lg bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <KindTag kind={entry.kind} />
                  <LevelBadge level={entry.level} />
                  <ModuleTag module={entry.module} />
                  {entry.particle ? (
                    <span className="text-[11px] text-slate-500">partícula: {entry.particle}</span>
                  ) : null}
                  {entry.separable !== undefined ? (
                    <span className="text-[11px] text-slate-500">
                      {entry.separable ? "separable" : "insegurable"}
                    </span>
                  ) : null}
                  {entry.register ? <span className="text-[11px] text-slate-500">{entry.register}</span> : null}
                  {entry.function ? <span className="text-[11px] text-slate-500">{entry.function}</span> : null}
                </div>
                <SpeakButton text={entry.term} label={`Escuchar ${entry.term}`} />
              </div>

              <h2 className="font-semibold text-slate-900">{entry.term}</h2>
              <p className="text-sm text-slate-700">{entry.definition}</p>
              <p className="text-xs italic text-slate-500">{entry.example}</p>
              {entry.notes ? <p className="text-xs text-amber-800">⚠️ {entry.notes}</p> : null}

              {entry.source === "USER" ? (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {entry.kind === "PATTERN" ? (
                    <label className="flex items-center gap-1 text-xs text-slate-500">
                      función
                      <select
                        value={entry.function ?? ""}
                        onChange={(event) => void patch(entry.id, { function: event.target.value || null })}
                        className="px-2 py-1 rounded-sm border border-slate-300 bg-white text-xs"
                      >
                        <option value="">sin clasificar</option>
                        {FUNCTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void remove(entry)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Borrar
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">contenido del curso</p>
              )}
            </article>
          ))}

          {shown < filtered.length ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setShown((value) => value + 20)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
              >
                Mostrar más ({filtered.length - shown} restantes)
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
