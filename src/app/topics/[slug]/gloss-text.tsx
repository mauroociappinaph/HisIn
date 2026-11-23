"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { buildLookup, isWordToken, tokenizeStory, type GlossEntry } from "@/modules/topics/glossary";
import { setActiveGloss } from "./gloss-store";

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
  const asked = useRef<Set<string>>(new Set());

  const ask = useCallback(
    async (raw: string) => {
      const term = raw.trim().replace(/[^A-Za-z'’\- ]/g, "");
      if (term.length < 2) return;
      const key = term.toLowerCase();
      if (answers[key] || asked.current.has(key)) return;
      asked.current.add(key);
      setActiveGloss({ term, translation: null, kind: null, busy: true });

      try {
        const response = await fetch("/api/glossary/lookup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ term, context: context ?? text.slice(0, 250) }),
        });
        const payload = (await response.json()) as Answer & { error?: string };
        if (response.ok && payload.translation) {
          setAnswers((previous) => ({ ...previous, [key]: payload }));
          setActiveGloss({
            term: payload.term ?? term,
            translation: payload.translation,
            kind: payload.kind ?? null,
            note: payload.note ?? null,
            busy: false,
          });
        }
      } catch {
        // A failed lookup leaves the word unglossed; hovering again retries.
        asked.current.delete(key);
      }
    },
    [answers, context, text],
  );

  const showGloss = (bare: string, local?: GlossEntry) => {
    const known = local ?? answers[bare.toLowerCase()];
    if (known) {
      setActiveGloss({ term: known.term, translation: known.translation, kind: known.kind, note: known.note, busy: false });
      return;
    }
    setActiveGloss({ term: bare, translation: null, kind: null, busy: true });
    void ask(bare);
  };

  return (
    <div>
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
              onMouseEnter={() => showGloss(bare, token.entry)}
              onFocus={() => showGloss(bare, token.entry)}
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

    </div>
  );
}
