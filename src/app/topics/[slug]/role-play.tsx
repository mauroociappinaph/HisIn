"use client";

import { useCallback, useState } from "react";

interface RolePlayData {
  situation: string;
  yourRole: string;
  theirRole: string;
  model: string;
  phrases: string[];
}

/**
 * The speaking step, alone.
 *
 * You read the scene, you write what you would say, and only then the model answer
 * appears - never before, because the point is to decide first and compare second.
 */
export function RolePlay({ slug }: { slug: string }) {
  const [data, setData] = useState<RolePlayData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [answer, setAnswer] = useState("");
  const [showModel, setShowModel] = useState(false);

  const start = useCallback(async () => {
    setState("loading");
    setData(null);
    setAnswer("");
    setShowModel(false);
    try {
      const response = await fetch(`/api/topics/${slug}/roleplay`, { method: "POST" });
      const payload = (await response.json()) as RolePlayData & { error?: string };
      if (!response.ok || payload.error) {
        setState("error");
        return;
      }
      setData(payload);
      setState("idle");
    } catch {
      setState("error");
    }
  }, [slug]);

  if (state === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-700">The role-play could not be built right now.</p>
        <button
          type="button"
          onClick={() => void start()}
          className="rounded-sm bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state === "loading") {
    return <p className="text-sm text-slate-500">Building the scene…</p>;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          A scene from your week: a person, a deadline, something at stake. Write what you would actually say, then
          compare with a model answer that uses this lesson&apos;s structure.
        </p>
        <button
          type="button"
          onClick={() => void start()}
          className="rounded-sm bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
        >
          Start the role-play
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">The scene</p>
        <p className="text-sm leading-7 text-slate-800">{data.situation}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-sm border border-indigo-200 bg-indigo-50/70 p-3">
          <p className="text-[11px] uppercase tracking-widest text-indigo-700">You are</p>
          <p className="text-sm text-slate-900">{data.yourRole}</p>
        </div>
        <div className="rounded-sm border border-slate-200 p-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">They are</p>
          <p className="text-sm text-slate-800">{data.theirRole}</p>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] uppercase tracking-widest text-slate-500">What do you say?</span>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={5}
          placeholder="Write it the way you would say it in the room."
          className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
        />
      </label>
      <p className="text-[11px] text-slate-500">{answer.trim().split(/\s+/).filter(Boolean).length} words</p>

      {showModel ? (
        <div className="space-y-2">
          <div className="rounded-sm border-l-4 border-emerald-400 bg-emerald-50/70 p-3">
            <p className="text-[11px] uppercase tracking-widest text-emerald-700">A model answer</p>
            <p className="text-sm leading-7 text-slate-900">{data.model}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.phrases.map((phrase) => (
              <span key={phrase} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-700">
                {phrase}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowModel(true)}
          disabled={answer.trim().length < 15}
          className="rounded-sm bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
        >
          Show the model answer
        </button>
      )}

      <button
        type="button"
        onClick={() => void start()}
        className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 hover:underline"
      >
        Another scene
      </button>
    </div>
  );
}
