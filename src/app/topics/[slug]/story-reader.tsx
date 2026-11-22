"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { speak } from "@/components/vocab-ui";
import {
  GLOSS_KIND_LABELS,
  buildLookup,
  isWordToken,
  tokenizeStory,
  type GlossEntry,
} from "@/modules/topics/glossary";

interface StoryReaderProps {
  title: string;
  body: string;
  glosses: GlossEntry[];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "of", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "his", "her", "their", "my",
  "your", "our", "as", "by", "from", "so", "if", "not", "no", "do", "does", "did",
]);

/**
 * Reads a story with the glossary underneath the cursor.
 *
 * Three layers, each one cheap enough to stay on the page: the native tooltip for
 * a glance, the panel below the paragraph for the translation and the kind of
 * unit, and the click that files the term in the learner's vocabulary. A phrasal
 * verb is one clickable unit, because "put up with" means aguantar and its three
 * words mean nothing on their own.
 */
export function StoryReader({ title, body, glosses }: StoryReaderProps) {
  const lookup = useMemo(() => buildLookup(glosses), [glosses]);
  const tokens = useMemo(() => tokenizeStory(body, lookup), [body, lookup]);
  const [hovered, setHovered] = useState<GlossEntry | null>(null);
  const [hoveredRaw, setHoveredRaw] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string, bad = false) => {
    setMessage({ text, bad });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3600);
  }, []);

  const save = useCallback(
    async (raw: string, entry?: GlossEntry) => {
      const term = (entry?.term ?? raw).replace(/[^A-Za-z'’\- ]/g, "").trim();
      if (term.length < 2) return;
      if (!entry && STOP_WORDS.has(term.toLowerCase())) {
        notify(`"${term}" es una palabra funcional: no vale la pena guardarla`, true);
        return;
      }
      if (saved.includes(term.toLowerCase())) {
        notify(`"${term}" ya la guardaste en esta historia`);
        return;
      }

      setBusy(term);
      try {
        const response = await fetch("/api/vocabulary/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: term }),
        });
        const payload = (await response.json()) as { entry?: { term: string }; error?: string };
        if (response.ok && payload.entry) {
          setSaved((previous) => [...previous, term.toLowerCase()]);
          notify(`"${payload.entry.term}" guardado · entra al repaso`);
          return;
        }
        if (response.status === 409) {
          setSaved((previous) => [...previous, term.toLowerCase()]);
          notify(`"${term}" ya estaba en tu vocabulario`);
          return;
        }
        notify(payload.error?.slice(0, 120) ?? "No pudimos analizar esa palabra", true);
      } catch {
        notify("No pudimos analizar esa palabra", true);
      } finally {
        setBusy(null);
      }
    },
    [notify, saved],
  );

  const hint = hovered ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => speak(body)}
            className="px-3 py-1.5 rounded-sm bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition"
          >
            🔊 Escuchar
          </button>
          <Link
            href="/review/vocab"
            className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-medium hover:border-indigo-300 transition"
          >
            Repasar este vocabulario →
          </Link>
        </div>
        <span className="text-[11px] text-slate-500">
          {glosses.length > 0 ? `${glosses.length} términos anotados` : "sin glosario todavía"}
        </span>
      </div>

      <h3 className="font-semibold text-slate-900">{title}</h3>

      <p className="text-sm leading-relaxed text-slate-800">
        {tokens.map((token, index) => {
          if (!isWordToken(token)) return <span key={`s-${index}`}>{token.text}</span>;

          const term = token.entry?.term;
          const bare = token.text.replace(/[^A-Za-z'’\- ]/g, "");
          const key = (term ?? bare).toLowerCase();
          const isSaved = saved.includes(key);
          const isPhrase = (token.entry?.term.split(/\s+/).length ?? 0) > 1;

          return (
            <button
              key={`w-${index}`}
              type="button"
              onMouseEnter={() => {
                setHoveredRaw(bare);
                setHovered(token.entry ?? null);
              }}
              onFocus={() => {
                setHoveredRaw(bare);
                setHovered(token.entry ?? null);
              }}
              onMouseLeave={() => {
                // The panel keeps the last term: the translation stays readable
                // while the pointer travels to it, instead of vanishing midway.
              }}
              onBlur={() => {
                // Same reason as mouseleave: keyboard users keep the last gloss.
              }}
              onClick={() => void save(bare, token.entry)}
              disabled={busy === (term ?? bare)}
              title={
                token.entry
                  ? `${token.entry.term} · ${token.entry.translation}${token.entry.note ? ` · ${token.entry.note}` : ""}`
                  : `Guardar "${bare}" y analizarla`
              }
              className={`rounded px-0.5 transition ${
                isSaved
                  ? "bg-emerald-100 text-emerald-800"
                  : isPhrase
                    ? "underline decoration-dotted decoration-indigo-400 underline-offset-4 text-indigo-900 hover:bg-indigo-100"
                    : hoveredRaw === bare
                      ? "bg-indigo-100 text-indigo-800"
                      : token.entry
                        ? "bg-slate-50 hover:bg-slate-100"
                        : "hover:bg-slate-100"
              }`}
            >
              {token.text}
            </button>
          );
        })}
      </p>

      <div className="min-h-[2.75rem] text-xs" aria-live="polite">
        {busy ? (
          <span className="text-indigo-700">Analizando “{busy}” con Gentleman Shell…</span>
        ) : hint ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-slate-900">{hint.term}</strong>
            <span className="text-slate-400">→</span>
            <span className="text-slate-800">{hint.translation}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] uppercase tracking-wide">
              {GLOSS_KIND_LABELS[hint.kind]}
            </span>
            {hint.note ? <span className="text-slate-500">{hint.note}</span> : null}
            <span className="text-slate-400">· click para guardarla</span>
          </span>
        ) : hoveredRaw ? (
          <span className="text-slate-500">
            <strong className="text-slate-700">{hoveredRaw}</strong> · sin traducción todavía · click para
            analizarla con Gentleman Shell
          </span>
        ) : (
          <span className="text-slate-400">
            Pasá el mouse por una palabra o por una frase subrayada: ves la traducción y, si hacés click, queda
            en tu vocabulario y en el repaso.
          </span>
        )}
      </div>

      {message ? (
        <p
          className={`text-xs rounded-sm px-3 py-2 border ${
            message.bad
              ? "text-amber-800 bg-amber-50 border-amber-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
