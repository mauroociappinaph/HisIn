"use client";

import type { CefrLevel } from "@/shared/types";

export const CEFR_STYLES: Record<CefrLevel, string> = {
  A1: "bg-emerald-100 text-emerald-700",
  A2: "bg-teal-100 text-teal-700",
  B1: "bg-sky-100 text-sky-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-violet-100 text-violet-700",
  C2: "bg-fuchsia-100 text-fuchsia-700",
};

export function LevelBadge({ level }: { level: CefrLevel }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${CEFR_STYLES[level] ?? "bg-slate-100 text-slate-600"}`}
    >
      {level}
    </span>
  );
}

export function humanizeModule(module: string): string {
  return module
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ModuleTag({ module }: { module: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
      {humanizeModule(module)}
    </span>
  );
}

export const KIND_LABELS: Record<string, string> = {
  WORD: "palabra",
  PHRASAL_VERB: "phrasal verb",
  PATTERN: "patrón",
  IDIOM: "expresión",
};

export function KindTag({ kind }: { kind: string }) {
  const tone =
    kind === "PHRASAL_VERB"
      ? "bg-amber-100 text-amber-700"
      : kind === "PATTERN"
        ? "bg-sky-100 text-sky-700"
        : kind === "IDIOM"
          ? "bg-violet-100 text-violet-700"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}>
      {KIND_LABELS[kind] ?? kind}
    </span>
  );
}

/** Speaks English text with the browser voice. Returns false when unsupported. */
export function speak(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function SpeakButton({
  text,
  label,
  tone = "light",
}: {
  text: string;
  label: string;
  tone?: "light" | "dark";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        speak(text);
      }}
      className={
        tone === "dark"
          ? "h-9 w-9 shrink-0 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
          : "h-9 w-9 shrink-0 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
      }
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}
