"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CefrLevel } from "@/shared/types";
import type { NewsAnalysis } from "@/modules/news/analysis";
import { LevelBadge } from "@/components/vocab-ui";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  excerpt: string;
  publishedAt: string | null;
  analyzed: boolean;
  analysis: NewsAnalysis | null;
}

const PARTICLE_HINT = /^(up|down|off|on|in|out|over|through|back|away|along|around|by|for|into|with|across|apart|after|about|against|from|to|at)$/i;

function looksPhrasal(term: string): boolean {
  const words = term.trim().split(/\s+/);
  return words.length === 2 && PARTICLE_HINT.test(words[1] ?? "");
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string; bad?: boolean } | null>(null);

  const notify = useCallback((message: string, bad = false) => {
    setToast({ id: Date.now(), message, bad });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;
    fetch("/api/news?limit=12&offset=0")
      .then((response) => response.json())
      .then((data: { items: NewsItem[]; total: number; hasMore: boolean }) => {
        if (!active) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/news", { method: "POST" });
      const body = (await response.json()) as { created: number; failed: string[]; fetched: number };
      const page = (await fetch("/api/news?limit=12&offset=0").then((r) => r.json())) as {
        items: NewsItem[];
        total: number;
        hasMore: boolean;
      };
      setItems(page.items ?? []);
      setTotal(page.total ?? 0);
      setHasMore(Boolean(page.hasMore));
      notify(
        body.created > 0
          ? `${body.created} noticias nuevas`
          : "No había noticias nuevas desde la última vez",
      );
      if (body.failed.length > 0) notify("Algunas fuentes no respondieron", true);
    } catch {
      notify("No pudimos actualizar las noticias", true);
    } finally {
      setSyncing(false);
    }
  }, [notify]);

  const analyze = useCallback(
    async (id: string) => {
      setAnalyzing(id);
      try {
        const response = await fetch(`/api/news/${id}/analyze`, { method: "POST" });
        const body = (await response.json()) as { analysis?: NewsAnalysis; error?: string };
        if (!response.ok || !body.analysis) {
          notify("Gentle Shell no pudo analizar esta nota", true);
          return;
        }
        setItems((previous) =>
          previous.map((item) => (item.id === id ? { ...item, analyzed: true, analysis: body.analysis! } : item)),
        );
        notify("Análisis listo");
      } catch {
        notify("Gentle Shell no pudo analizar esta nota", true);
      } finally {
        setAnalyzing(null);
      }
    },
    [notify],
  );

  const saveWord = useCallback(
    async (entry: { term: string; definition: string; example: string }, level: CefrLevel) => {
      const kinds = looksPhrasal(entry.term) ? (["PHRASAL_VERB", "WORD"] as const) : (["WORD"] as const);
      for (const kind of kinds) {
        const response = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...entry,
            kind,
            level,
            module: "reading",
            notes: "Desde una noticia",
            ...(kind === "PHRASAL_VERB" ? { separable: true } : {}),
          }),
        });
        if (response.ok) {
          notify(`"${entry.term}" guardado, ya entra al repaso`);
          return;
        }
        if (response.status === 409) {
          notify(`"${entry.term}" ya estaba en tu biblioteca`);
          return;
        }
      }
      notify(`No pudimos guardar "${entry.term}"`, true);
    },
    [notify],
  );

  const savePattern = useCallback(
    async (pattern: NewsAnalysis["patterns"][number], level: CefrLevel) => {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          term: pattern.frame,
          definition: pattern.example,
          example: pattern.example,
          kind: "PATTERN",
          level,
          module: "grammar",
          function: pattern.function,
          notes: pattern.commonError,
        }),
      });
      if (response.ok) notify(`Patrón "${pattern.frame}" guardado`);
      else if (response.status === 409) notify("Ese patrón ya estaba guardado");
      else notify("No pudimos guardar el patrón", true);
    },
    [notify],
  );

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const page = (await fetch(`/api/news?limit=12&offset=${items.length}`).then((r) => r.json())) as {
        items: NewsItem[];
        total: number;
        hasMore: boolean;
      };
      setItems((previous) => [...previous, ...(page.items ?? [])]);
      setTotal(page.total ?? 0);
      setHasMore(Boolean(page.hasMore));
    } catch {
      notify("No pudimos traer más noticias", true);
    } finally {
      setLoadingMore(false);
    }
  }, [items.length, notify]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Noticias</h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Healthtech, emprendimiento y regulación, en inglés real. Gentle Shell lee cada nota y extrae el
            vocabulario y los patrones que te sirven para escribir y hablar de lo tuyo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void sync()}
          disabled={syncing}
          className="px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {syncing ? "Buscando…" : "Actualizar noticias"}
        </button>
      </header>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-28 rounded-lg bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg bg-white border border-slate-200 p-8 text-center space-y-2">
          <p className="font-medium text-slate-700">Todavía no hay noticias guardadas.</p>
          <p className="text-sm text-slate-500">
            Traé las últimas de Fierce Healthcare, MobiHealthNews, TechCrunch, Sifted y STAT News.
          </p>
          <button
            type="button"
            onClick={() => void sync()}
            className="mt-2 px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Traer noticias ahora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">{item.source}</span>
                {item.publishedAt ? <span>{new Date(item.publishedAt).toLocaleDateString("es-AR")}</span> : null}
                {item.analysis ? <LevelBadge level={item.analysis.level} /> : null}
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600">
                  {item.title}
                </a>
              </h2>
              <p className="text-sm text-slate-600 line-clamp-3">{item.excerpt}</p>

              <div className="flex flex-wrap items-center gap-2">
                {item.analysis ? (
                  <span className="text-xs text-emerald-600 font-semibold">✓ analizada</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void analyze(item.id)}
                    disabled={analyzing === item.id}
                    className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 transition"
                  >
                    {analyzing === item.id ? "Leyendo la nota…" : "Analizar con Gentle Shell"}
                  </button>
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Leer original ↗
                </a>
              </div>

              {item.analysis ? (
                <div className="mt-2 space-y-4 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-700">{item.analysis.summary}</p>

                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-slate-500">Vocabulario</h3>
                    <ul className="space-y-2">
                      {item.analysis.vocabulary.map((entry) => (
                        <li
                          key={entry.term}
                          className="flex flex-wrap items-start justify-between gap-2 p-3 rounded-sm bg-slate-50 border border-slate-200"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{entry.term}</p>
                            <p className="text-xs text-slate-600">{entry.definition}</p>
                            <p className="text-xs italic text-slate-500">{entry.example}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void saveWord(entry, item.analysis!.level)}
                            className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                          >
                            + Guardar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-slate-500">Patrones</h3>
                    <ul className="space-y-2">
                      {item.analysis.patterns.map((pattern) => (
                        <li
                          key={pattern.frame}
                          className="flex flex-wrap items-start justify-between gap-2 p-3 rounded-sm bg-sky-50 border border-sky-200"
                        >
                          <div className="min-w-0">
                            <p className="font-mono font-semibold text-slate-800 text-sm">{pattern.frame}</p>
                            <p className="text-xs text-slate-600">{pattern.example}</p>
                            <p className="text-xs text-amber-800">⚠️ {pattern.commonError}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void savePattern(pattern, item.analysis!.level)}
                            className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                          >
                            + Guardar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300 disabled:opacity-50"
          >
            {loadingMore ? "Trayendo…" : "Cargar más noticias"}
          </button>
          <span className="text-xs text-slate-500">
            {items.length} de {total}
          </span>
        </div>
      ) : null}

      <p className="text-xs text-slate-400">
        ¿Querés practicar lo guardado?{" "}
        <Link href="/review/vocab" className="text-indigo-600 hover:underline">
          Va al repaso espaciado
        </Link>
        .
      </p>

      <div aria-live="polite" className="fixed bottom-24 right-6 z-20">
        {toast ? (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-sm text-white text-sm font-medium shadow-md ${
              toast.bad ? "bg-rose-600" : "bg-emerald-600"
            }`}
          >
            {toast.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
