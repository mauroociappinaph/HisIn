"use client";

import { useState } from "react";
import Link from "next/link";

interface Mistake {
  id: string;
  kind: string;
  original: string;
  corrected: string;
  why: string;
  topicSlug: string | null;
}

/**
 * The deck built from your own writing.
 *
 * You wrote it wrong once; you see it now, say it right, and grade yourself. Three
 * clean recalls retire the card.
 */
export function MistakeDeck({ mistakes, total }: { mistakes: Mistake[]; total: number }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState(0);

  if (mistakes.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-700">No mistakes to review.</p>
        <Link href="/write" className="text-xs font-semibold text-indigo-600 hover:underline">
          Write an email and get it corrected →
        </Link>
      </div>
    );
  }

  const current = mistakes[index];
  if (!current) {
    return (
      <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-6 text-center">
        <p className="text-sm font-semibold text-emerald-900">Deck done: {graded} graded.</p>
        <Link href="/write" className="text-xs font-semibold text-emerald-800 hover:underline">
          Write another email →
        </Link>
      </div>
    );
  }

  const grade = async (quality: number) => {
    setGraded((value) => value + 1);
    setRevealed(false);
    setIndex((value) => value + 1);
    try {
      await fetch(`/api/mistakes/${current.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quality }),
      });
    } catch {
      // A failed grade is retried on the next pass: the card is still due.
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Card {index + 1} of {mistakes.length} · {total} open
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 uppercase tracking-wide">{current.kind}</span>
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">You wrote</p>
        <p className="text-sm text-rose-700 line-through decoration-rose-300">{current.original}</p>

        {revealed ? (
          <>
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Say instead</p>
            <p className="text-base font-medium text-emerald-800">{current.corrected}</p>
            <p className="text-sm leading-7 text-slate-700">{current.why}</p>
            {current.topicSlug ? (
              <Link href={`/topics/${current.topicSlug}`} className="text-[11px] font-semibold text-indigo-600 hover:underline">
                Read the lesson →
              </Link>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => void grade(1)}
                className="rounded-sm bg-rose-100 px-3 py-1.5 text-rose-800 hover:bg-rose-200"
              >
                I got it wrong
              </button>
              <button
                type="button"
                onClick={() => void grade(3)}
                className="rounded-sm bg-amber-100 px-3 py-1.5 text-amber-900 hover:bg-amber-200"
              >
                With effort
              </button>
              <button
                type="button"
                onClick={() => void grade(5)}
                className="rounded-sm bg-emerald-100 px-3 py-1.5 text-emerald-800 hover:bg-emerald-200"
              >
                Straight away
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="rounded-sm bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-95"
          >
            Show the correction
          </button>
        )}
      </div>
    </div>
  );
}
