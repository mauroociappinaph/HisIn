"use client";

import { useSyncExternalStore } from "react";
import { GLOSS_KIND_LABELS, type GlossKind } from "@/modules/topics/glossary";
import { getGlossServerSnapshot, getGlossSnapshot, subscribeGloss } from "./gloss-store";

/**
 * The only place the lesson explains a word.
 *
 * It sits under the tabs, once, and it changes as the pointer moves: no instruction
 * repeated under every paragraph, no panel following the mouse.
 */
export function GlossBar() {
  const active = useSyncExternalStore(subscribeGloss, getGlossSnapshot, getGlossServerSnapshot);

  return (
    <div
      className="sticky top-14 z-20 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-slate-200 bg-slate-50/95 px-4 py-2 text-xs shadow-sm backdrop-blur"
      aria-live="polite"
    >
      {!active ? (
        <span className="text-slate-500">
          Pasá el mouse por cualquier palabra o frase: el significado aparece acá y queda guardado para todas las
          lecciones.
        </span>
      ) : active.busy ? (
        <span className="text-slate-500">
          Buscando <strong className="text-slate-700">{active.term}</strong>…
        </span>
      ) : (
        <>
          <strong className="text-slate-900">{active.term}</strong>
          <span className="text-slate-400">→</span>
          <span className="text-slate-900">{active.translation}</span>
          {active.kind ? (
            <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-indigo-700">
              {GLOSS_KIND_LABELS[active.kind as GlossKind] ?? active.kind}
            </span>
          ) : null}
          {active.note ? <span className="text-slate-500">{active.note}</span> : null}
        </>
      )}
    </div>
  );
}
