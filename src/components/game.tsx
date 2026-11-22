/**
 * The game surface: a ring for the level, a flame for the streak, a bar for the
 * day. Reused by the home and the shell so the same numbers always look the same.
 */
export function Ring({
  ratio,
  label,
  sublabel,
  tone = "indigo",
  size = 72,
}: {
  ratio: number;
  label: string;
  sublabel?: string;
  tone?: "indigo" | "amber" | "emerald";
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color =
    tone === "amber" ? "stroke-amber-500" : tone === "emerald" ? "stroke-emerald-500" : "stroke-indigo-600";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`${color} transition-all duration-500`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        {sublabel ? <span className="text-[9px] text-slate-500 mt-0.5">{sublabel}</span> : null}
      </div>
    </div>
  );
}

/** A thin progress bar with the same motion language as the rings. */
export function Bar({ ratio, tone = "indigo" }: { ratio: number; tone?: "indigo" | "amber" | "emerald" }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const fill = tone === "amber" ? "bg-amber-400" : tone === "emerald" ? "bg-emerald-500" : "bg-indigo-600";
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div
        className={`h-full rounded-full ${fill} transition-all duration-500`}
        style={{ width: `${clamped * 100}%` }}
        role="progressbar"
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

/** Earned and pending badges; pending ones read as a goal, not as a locked door. */
export function MilestoneStrip({
  items,
}: {
  items: { id: string; label: string; detail: string; earned: boolean }[];
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          title={item.detail}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition ${
            item.earned
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-white border-slate-200 text-slate-400"
          }`}
        >
          {item.earned ? "✓" : "○"} {item.label}
        </li>
      ))}
    </ul>
  );
}
