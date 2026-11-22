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

interface AnalyzedEntry {
  term: string;
  definition?: string;
}

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
  // What the engine said about the word you clicked: shown in place, not in a
  // toast that disappears before you can read it. Clicking a word you do not know
  // must answer "what does it mean" immediately, not just file it away.
  const [analysis, setAnalysis] = useState<{ term: string; definition: string; translation?: string } | null>(null);
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
        notify(`"${term}" is a function word: not worth saving`, true);
        return;
      }
      if (saved.includes(term.toLowerCase())) {
        notify(`"${term}" is already saved from this story`);
        return;
      }

      setBusy(term);
      setAnalysis(null);

      // The Spanish answer is what the learner asked for, so for a word the
      // glossary does not cover it is requested in parallel with the filing.
      const translationRequest = entry
        ? Promise.resolve<string | null>(null)
        : fetch("/api/glossary/translate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ term, context: body.slice(0, 300) }),
          })
            .then((response) => (response.ok ? response.json() : null))
            .then((payload: { translation?: string } | null) => payload?.translation ?? null)
            .catch(() => null);

      try {
        const response = await fetch("/api/vocabulary/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: term }),
        });
        const payload = (await response.json()) as { entry?: AnalyzedEntry; error?: string };
        if (response.ok && payload.entry) {
          const translated = entry ? entry.translation : await translationRequest;
          setSaved((previous) => [...previous, term.toLowerCase()]);
          setAnalysis({
            term: payload.entry.term,
            definition: payload.entry.definition ?? "",
            ...(translated ? { translation: translated } : {}),
          });
          notify(`"${payload.entry.term}" saved · it is now in the review queue`);
          return;
        }
        if (response.status === 409) {
          // Already in the bank: the learner still asked what it means, so the
          // translation is shown instead of only saying "you had it already".
          const translated = entry ? entry.translation : await translationRequest;
          setSaved((previous) => [...previous, term.toLowerCase()]);
          setAnalysis({ term, definition: "", ...(translated ? { translation: translated } : {}) });
          notify(`"${term}" was already in your vocabulary`);
          return;
        }
        notify(payload.error?.slice(0, 120) ?? "That word could not be analysed", true);
      } catch {
        notify("That word could not be analysed", true);
      } finally {
        setBusy(null);
      }
    },
    [body, notify, saved],
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
            🔊 Listen
          </button>
          <Link
            href="/review/vocab"
            className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-medium hover:border-indigo-300 transition"
          >
            Review this vocabulary →
          </Link>
        </div>
        <span className="text-[11px] text-slate-500">
          {glosses.length > 0 ? `${glosses.length} glossed terms` : "no glossary yet"}
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
          <span className="text-indigo-700">Analysing “{busy}” …</span>
        ) : analysis ? (
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-slate-900">{analysis.term}</strong>
            <span className="text-slate-400">→</span>
            <span className="text-slate-900">{analysis.translation ?? analysis.definition}</span>
            {analysis.translation && analysis.definition ? (
              <span className="text-slate-600">{analysis.definition}</span>
            ) : null}
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wide">
              saved
            </span>
            <Link href="/review/vocab" className="text-indigo-600 underline">
              go to review
            </Link>
          </span>
        ) : hint ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-slate-900">{hint.term}</strong>
            <span className="text-slate-400">→</span>
            <span className="text-slate-800">{hint.translation}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] uppercase tracking-wide">
              {GLOSS_KIND_LABELS[hint.kind]}
            </span>
            {hint.note ? <span className="text-slate-500">{hint.note}</span> : null}
            <span className="text-slate-400">· click to save it</span>
          </span>
        ) : hoveredRaw ? (
          <span className="text-slate-500">
            <strong className="text-slate-700">{hoveredRaw}</strong> · sin traducción todavía · click para
            analizarla con Gentleman Shell
          </span>
        ) : (
          <span className="text-slate-400">
            Hover a word or an underlined phrase to see what it means; click it and it goes into your
            vocabulary and the review queue.
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
