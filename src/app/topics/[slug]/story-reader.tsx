"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { speak } from "@/components/vocab-ui";

interface StoryReaderProps {
  title: string;
  body: string;
}

interface Token {
  text: string;
  word: boolean;
}

/** Splits on spaces but keeps punctuation glued to the word, so nothing is lost. */
function tokenize(body: string): Token[] {
  return body
    .split(/(\s+)/)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({
      text: chunk,
      word: /[A-Za-z]/.test(chunk) && !/^\s+$/.test(chunk),
    }));
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "of", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "his", "her", "their", "my",
  "your", "our", "as", "by", "from", "so", "if", "not", "no", "do", "does", "did",
]);

/**
 * Reads a story the way the news reader works: hover shows what you are pointing
 * at, click sends that word through the same analysis pipeline that classifies
 * and files it, and audio reads the whole text aloud.
 *
 * Deliberately not a full dictionary: the value here is capturing a word *while
 * reading it in context*, and the engine already does the definition, example and
 * routing better than a static glossary could.
 */
export function StoryReader({ title, body }: StoryReaderProps) {
  const tokens = useMemo(() => tokenize(body), [body]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string, bad = false) => {
    setMessage({ text, bad });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);

  const save = useCallback(
    async (raw: string) => {
      const word = raw.replace(/[^A-Za-z'’-]/g, "").trim();
      if (word.length < 2) return;
      if (STOP_WORDS.has(word.toLowerCase())) {
        notify(`"${word}" es una palabra funcional: no vale la pena guardarla`, true);
        return;
      }
      if (saved.includes(word)) {
        notify(`"${word}" ya la guardaste en esta historia`);
        return;
      }

      setBusy(word);
      try {
        const response = await fetch("/api/vocabulary/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input: word }),
        });
        const payload = (await response.json()) as { entry?: { term: string }; error?: string };
        if (response.ok && payload.entry) {
          setSaved((previous) => [...previous, word]);
          notify(`"${payload.entry.term}" guardado · entra al repaso`);
          return;
        }
        if (response.status === 409) {
          setSaved((previous) => [...previous, word]);
          notify(`"${word}" ya estaba en tu vocabulario`);
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
      </div>

      <h3 className="font-semibold text-slate-900">{title}</h3>

      <p className="text-sm leading-relaxed text-slate-800">
        {tokens.map((token, index) =>
          token.word ? (
            <button
              key={`${token.text}-${index}`}
              type="button"
              onMouseEnter={() => setHovered(token.text)}
              onFocus={() => setHovered(token.text)}
              onMouseLeave={() => setHovered((current) => (current === token.text ? null : current))}
              onBlur={() => setHovered(null)}
              onClick={() => void save(token.text)}
              disabled={busy === token.text}
              className={`rounded px-0.5 transition ${
                saved.includes(token.text.replace(/[^A-Za-z'’-]/g, ""))
                  ? "bg-emerald-100 text-emerald-800"
                  : hovered === token.text
                    ? "bg-indigo-100 text-indigo-800"
                    : "hover:bg-slate-100"
              }`}
              title={`Guardar "${token.text}" y analizarla`}
            >
              {token.text}
            </button>
          ) : (
            <span key={`space-${index}`}>{token.text}</span>
          ),
        )}
      </p>

      <div className="min-h-[1.5rem] text-xs" aria-live="polite">
        {busy ? (
          <span className="text-indigo-700">Analizando “{busy}” con Gentleman Shell…</span>
        ) : hovered ? (
          <span className="text-slate-500">
            <strong className="text-slate-700">{hovered}</strong> · click para guardarla y analizarla
          </span>
        ) : (
          <span className="text-slate-400">
            Pasá el mouse por una palabra y hacé click para guardarla. Queda en tu vocabulario y en el repaso.
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
