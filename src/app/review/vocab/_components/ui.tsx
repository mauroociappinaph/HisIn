"use client";

/**
 * The trainer and the phrasal verb / pattern sections share one set of visual
 * primitives, so they cannot drift apart; ProgressBar and Stat are trainer-only
 * and stay here.
 */
export {
  CEFR_STYLES,
  KIND_LABELS,
  KindTag,
  LevelBadge,
  ModuleTag,
  SpeakButton,
  humanizeModule,
  speak,
} from "@/components/vocab-ui";

export function ProgressBar({
  value,
  tone = "indigo",
  onDark = false,
}: {
  value: number;
  tone?: "indigo" | "amber";
  onDark?: boolean;
}) {
  const width = Math.max(0, Math.min(100, value));
  const track = onDark ? "bg-white/25" : "bg-slate-200";
  const fill = onDark ? "bg-white" : tone === "amber" ? "bg-amber-400" : "bg-indigo-600";
  return (
    <div className={`h-2 w-full rounded-full overflow-hidden ${track}`}>
      <div
        className={`h-full transition-all duration-300 ${fill}`}
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-white border border-slate-200">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-800 leading-tight">{value}</div>
      {hint ? <div className="text-[10px] text-slate-400">{hint}</div> : null}
    </div>
  );
}
