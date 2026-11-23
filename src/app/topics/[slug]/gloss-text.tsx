"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { buildLookup, isWordToken, tokenizeStory, GLOSS_KIND_LABELS, type GlossEntry } from "@/modules/topics/glossary";

interface GlossTextProps {
  text: string;
  /** The lesson's own glossary: instant, no request. */
  glosses?: GlossEntry[];
  /** Sentences around a word, sent so the meaning matches the usage. */
  context?: string;
  className?: string;
}

interface Answer {
  term: string;
  translation: string;
  kind: GlossEntry["kind"];
  note?: string;
}

/**
 * Any text of the lesson, with every unknown word answering on hover.
 *
 * Three layers, cheapest first: the lesson's glossary (already in the page), the
 * shared term cache (one request per term, ever), and the engine only when the term is
 * new. The cache is what makes this efficient without repeating work: hovering the
 * same word in another lesson costs nothing.
 */
export function GlossText({ text, glosses = [], context, className }: GlossTextProps) {
  const lookup = useMemo(() => buildLookup(glosses), [glosses]);
  const tokens = useMemo(() => tokenizeStory(text, lookup), [text, lookup]);

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [hover, setHover] = useState<{ term: string; local?: GlossEntry } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const asked = useRef<Set<string>>(new Set());

  const ask = useCallback(
    async (raw: string) => {
      const term = raw.trim().replace(/[^A-Za-z'’\- ]/g, "");
      if (term.length < 2) return;
      const key = term.toLowerCase();
      if (answers[key] || asked.current.has(key)) return;
      asked.current.add(key);
      setBusy(key);

      try {
        const response = await fetch("/api/glossary/lookup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ term, context: context ?? text.slice(0, 250) }),
        });
        const payload = (await response.json()) as Answer & { error?: string };
        if (response.ok && payload.translation) {
          setAnswers((previous) => ({ ...previous, [key]: payload }));
        }
      } catch {
        // A failed lookup leaves the word unglossed; hovering again retries.
        asked.current.delete(key);
      } finally {
        setBusy(null);
      }
    },
    [answers, context, text],
  );

  const panel = hover?.local ?? (hover ? answers[hover.term.toLowerCase()] : undefined);

  return (
    <div className="space-y-2">
      <p className={className ?? "text-[15px] leading-8 text-slate-800"}>
        {tokens.map((token, index) => {
          if (!isWordToken(token)) return <span key={`s-${index}`}>{token.text}</span>;

          const bare = token.text.replace(/[^A-Za-z'’\- ]/g, "");
          const local = token.entry;
          const known = local ?? answers[bare.toLowerCase()];
          const isPhrase = (token.entry?.term.split(/\s+/).length ?? 0) > 1;

          return (
            <button
              key={`w-${index}`}
              type="button"
              onMouseEnter={() => {
                setHover({ term: bare, local: token.entry });
                if (!token.entry) void ask(bare);
              }}
              onFocus={() => {
                setHover({ term: bare, local: token.entry });
                if (!token.entry) void ask(bare);
              }}
              title={known ? `${known.term} · ${known.translation}` : `Ver qué significa "${bare}"`}
              className={`rounded px-0.5 transition ${
                isPhrase
                  ? "underline decoration-dotted decoration-indigo-400 underline-offset-4"
                  : known
                    ? "hover:bg-indigo-100"
                    : "hover:bg-slate-100"
              }`}
            >
              {token.text}
            </button>
          );
        })}
      </p>

      <div className="min-h-[1.5rem] text-xs" aria-live="polite">
        {busy ? (
          <span className="text-slate-500">Buscando “{busy}”…</span>
        ) : panel ? (
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-slate-900">{panel.term}</strong>
            <span className="text-slate-400">→</span>
            <span className="text-slate-900">{panel.translation}</span>
            <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-indigo-700">
              {GLOSS_KIND_LABELS[panel.kind]}
            </span>
            {panel.note ? <span className="text-slate-500">{panel.note}</span> : null}
          </span>
        ) : hover ? (
          <span className="text-slate-500">
            <strong className="text-slate-700">{hover.term}</strong> · buscando el significado…
          </span>
        ) : (
          <span className="text-slate-400">
            Pasá el mouse por cualquier palabra: si no está en el glosario, el significado se busca una sola vez y
            queda guardado para todas las lecciones.
          </span>
        )}
      </div>
    </div>
  );
}
