"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

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
      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
        <Checkbox checked={done} disabled={busy} onCheckedChange={() => void toggle()} aria-label="Lesson done" />
        {done ? "Lesson done" : "Mark as done"}
      </label>
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
