"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Marks a grammar topic as seen; it reuses the lesson completion pipeline. */
export function MarkSeen({ topicSlug }: { topicSlug: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // The page stays static; the learner's own state is read here.
  useEffect(() => {
    let active = true;
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data: { completedLessonIds: string[] }) => {
        if (active) setDone(data.completedLessonIds.includes(`grammar:${topicSlug}`));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [topicSlug]);

  async function mark() {
    setBusy(true);
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "lesson", lessonId: `grammar:${topicSlug}`, items: 1, xp: 10 }),
      });
      if (response.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void mark()}
      disabled={done || busy}
      className={`px-4 py-2 rounded-sm text-sm font-semibold transition ${
        done
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {done ? "✓ Tema visto" : busy ? "Guardando…" : "Marcar como visto"}
    </button>
  );
}
