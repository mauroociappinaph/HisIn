"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EntryForm } from "@/components/entry-form";
import { KindTag, LevelBadge } from "@/components/vocab-ui";
import type { VocabularyDTO } from "@/shared/types";

interface Saved {
  entry: VocabularyDTO;
  section: { href: string; label: string };
}

/**
 * Global quick-add: one field.
 *
 * You type what you met — a word, a phrasal verb, an idiom, a pattern — and
 * Gentle Shell classifies it, writes the definition and an example in your
 * domain, and files it in the section it belongs to. The full manual form stays
 * available for when you want to write the entry yourself.
 */
export function QuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setManual(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  const submit = useCallback(async () => {
    const value = input.trim();
    if (value.length < 2) {
      setError("Escribí una palabra o una frase.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const response = await fetch("/api/vocabulary/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const body = (await response.json()) as Saved & { error?: string; section?: Saved["section"] };
      if (!response.ok) {
        setError(body.error ?? "No pudimos analizarlo.");
        return;
      }
      setSaved({ entry: body.entry, section: body.section });
      setInput("");
      router.refresh();
    } catch {
      setError("No pudimos analizarlo.");
    } finally {
      setBusy(false);
    }
  }, [input, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Agregar palabra o frase"
        title="Agregar palabra o frase"
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full bg-indigo-600 text-white text-3xl leading-none shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition"
      >
        <span aria-hidden="true">＋</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Agregar palabra o frase"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="max-w-xl mx-auto my-10 px-4">
            <div className="rounded-lg bg-white border border-slate-200 shadow-lg p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-800">¿Qué encontraste?</h2>
                  <p className="text-xs text-slate-500">
                    Palabra, phrasal verb, expresión o patrón. El motor lo clasifica, escribe la definición y el
                    ejemplo, y lo guarda en la sección que corresponde.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar"
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !busy) void submit();
                  }}
                  placeholder="put up with · cut corners · make + object + verb"
                  aria-label="Palabra o frase"
                  className="flex-1 px-4 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {busy ? "Analizando…" : "Analizar y guardar"}
                </button>
              </div>

              {busy ? (
                <p className="text-xs text-slate-500" aria-live="polite">
                  Gentle Shell está leyendo la expresión, decidiendo qué tipo es y escribiendo el ejemplo…
                </p>
              ) : null}

              {error ? (
                <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-3 py-2">
                  {error}
                </p>
              ) : null}

              {saved ? (
                <div className="rounded-sm bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <KindTag kind={saved.entry.kind} />
                    <LevelBadge level={saved.entry.level} />
                    <span className="text-xs text-emerald-700 font-semibold">
                      guardado en {saved.section.label}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{saved.entry.term}</p>
                  <p className="text-sm text-slate-700">{saved.entry.definition}</p>
                  <p className="text-xs italic text-slate-500">{saved.entry.example}</p>
                  {saved.entry.notes ? <p className="text-xs text-amber-800">⚠️ {saved.entry.notes}</p> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={saved.section.href}
                      className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                    >
                      Ver en {saved.section.label}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSaved(null)}
                      className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-medium hover:border-indigo-300"
                    >
                      Agregar otra
                    </button>
                  </div>
                </div>
              ) : null}

              {!saved && !manual ? (
                <button
                  type="button"
                  onClick={() => setManual(true)}
                  className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                >
                  Prefiero escribir la entrada a mano
                </button>
              ) : null}

              {manual ? (
                <div className="border-t border-slate-200 pt-4">
                  <EntryForm
                    kinds={["WORD", "PHRASAL_VERB", "PATTERN", "IDIOM"]}
                    defaultOpen
                    onClose={close}
                    onCreated={(entry) => {
                      setSaved({
                        entry,
                        section: {
                          href:
                            entry.kind === "PATTERN"
                              ? "/patterns"
                              : entry.kind === "PHRASAL_VERB" || entry.kind === "IDIOM"
                                ? "/phrasal-verbs"
                                : "/review/vocab",
                          label:
                            entry.kind === "PATTERN"
                              ? "Patrones"
                              : entry.kind === "PHRASAL_VERB" || entry.kind === "IDIOM"
                                ? "Phrasal verbs"
                                : "Tu vocabulario",
                        },
                      });
                      router.refresh();
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
