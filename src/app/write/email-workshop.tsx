"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { Correction } from "@/modules/production/correction";
import { MISTAKE_KIND_LABELS, overallScore } from "@/modules/production/correction";

const AUDIENCES = [
  "an investor",
  "a clinical partner",
  "a hospital IT team",
  "a candidate",
  "my own team",
  "a regulator",
];

/**
 * Write the email you actually have to write, then read what was wrong with it.
 *
 * The correction stays on screen next to the original, and every change links to the
 * lesson that explains it, so "your email is wrong" becomes "this rule, here".
 */
export function EmailWorkshop() {
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setState("loading");
    setMessage(null);
    setCorrection(null);
    try {
      const response = await fetch("/api/production/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, audience }),
      });
      const payload = (await response.json()) as { correction?: Correction; saved?: number; error?: string };
      if (!response.ok || !payload.correction) {
        setState("error");
        setMessage(payload.error?.slice(0, 160) ?? "The correction failed.");
        return;
      }
      setCorrection(payload.correction);
      setMessage(payload.saved ? `${payload.saved} mistakes filed for review.` : null);
      setState("idle");
    } catch {
      setState("error");
      setMessage("The correction failed.");
    }
  }, [audience, email]);

  const words = email.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-[11px] uppercase tracking-widest text-slate-500" htmlFor="email">
            Your email
          </label>
          <span className="text-[11px] text-slate-500">{words} words</span>
        </div>
        <textarea
          id="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          rows={10}
          placeholder="Paste the email you have to send. Bad English welcome: that is the point."
          className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm leading-7 text-slate-900 outline-none focus:border-indigo-400"
        />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label htmlFor="audience" className="text-slate-500">
            For
          </label>
          <select
            id="audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-slate-800"
          >
            {AUDIENCES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={state === "loading" || words < 8}
            className="ml-auto rounded-sm bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
          >
            {state === "loading" ? "Correcting…" : "Correct my email"}
          </button>
        </div>
        {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      </section>

      {correction ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-2xl font-bold tabular-nums text-indigo-700">{overallScore(correction)}</span>
            <span className="text-xs text-slate-500">out of 5</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
              register: {correction.register.replace("-", " ")}
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              {Object.entries(correction.scores).map(([criterion, score]) => (
                <span key={criterion} className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-800">
                  {criterion} {score}/5
                </span>
              ))}
            </div>
          </div>

          <p className="max-w-prose text-sm leading-7 text-slate-700">{correction.summary}</p>

          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-[11px] uppercase tracking-widest text-emerald-700">The corrected version</p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-900">{correction.corrected}</p>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(correction.corrected)}
              className="rounded-sm bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Copy
            </button>
          </div>

          {correction.changes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">
                {correction.changes.length} changes, and where each one lives
              </p>
              <ul className="space-y-2">
                {correction.changes.map((change, index) => (
                  <li key={`${change.original}-${index}`} className="rounded-sm border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600">
                        {MISTAKE_KIND_LABELS[change.kind]}
                      </span>
                      <span className="text-sm text-rose-700 line-through decoration-rose-300">{change.original}</span>
                      <span aria-hidden="true" className="text-slate-400">
                        →
                      </span>
                      <span className="text-sm font-medium text-emerald-800">{change.corrected}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{change.why}</p>
                    {change.topicSlug ? (
                      <Link
                        href={`/topics/${change.topicSlug}`}
                        className="mt-1 inline-block text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Read the lesson →
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-sm border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
              Nothing to fix: this email is clean.
            </p>
          )}

          <Link href="/review/mistakes" className="inline-block text-xs font-semibold text-indigo-600 hover:underline">
            Review these mistakes →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
