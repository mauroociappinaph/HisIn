"use client";

import { useState } from "react";

/**
 * The checkbox that makes a lesson count.
 *
 * Optimistic and idempotent: the click flips the box immediately and the server
 * answers with the module's progress, which is what the copy under it reports. If
 * the call fails the box goes back, because a checked box that saved nothing is a
 * lie about progress.
 */
export function LessonDone({
  slug,
  initialDone,
  completed,
  total,
}: {
  slug: string;
  initialDone: boolean;
  completed: number;
  total: number;
}) {
  const [done, setDone] = useState(initialDone);
  const [counts, setCounts] = useState({ completed, total });
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !done;
    setDone(next);
    setBusy(true);
    try {
      const response = await fetch(`/api/topics/${slug}/complete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      const payload = (await response.json()) as { done?: boolean; completed?: number; unitTotal?: number };
      if (!response.ok) {
        setDone(!next);
        return;
      }
      setCounts({
        completed: payload.completed ?? counts.completed,
        total: payload.unitTotal ?? counts.total,
      });
    } catch {
      setDone(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white border border-slate-200 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        onClick={() => void toggle()}
        disabled={busy}
        className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
          done ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <span
          aria-hidden="true"
          className={`grid h-4 w-4 place-items-center rounded-[3px] border text-[10px] ${
            done ? "border-white/60 bg-white/20" : "border-slate-400"
          }`}
        >
          {done ? "✓" : ""}
        </span>
        {done ? "Lesson done" : "Mark as done"}
      </button>
      <span className="text-[11px] text-slate-500">
        {counts.completed} of {counts.total} in this module done
      </span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: Math.min(counts.total, 12) }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 w-3 rounded-full ${index < counts.completed ? "bg-emerald-500" : "bg-slate-200"}`}
          />
        ))}
      </span>
    </div>
  );
}
