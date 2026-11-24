import type { ReactNode } from "react";

/**
 * The visual aids of a lesson, drawn as SVG.
 *
 * Every one of them encodes the rule itself, not decoration: a conditional is a
 * fork, data commentary is a trend, a contrast is two sentences side by side.
 */

/** if → then as a fork, with the four conditional types on the branches. */
export function ConditionalFlow({ kind }: { kind: "zero" | "first" | "second" | "third" }) {
  const labels: Record<typeof kind, { condition: string; result: string; time: string }> = {
    zero: { condition: "If + present", result: "present", time: "siempre cierto" },
    first: { condition: "If + present", result: "will + verb", time: "futuro real" },
    second: { condition: "If + past", result: "would + verb", time: "presente imaginario" },
    third: { condition: "If + had + participle", result: "would have + participle", time: "pasado que no fue" },
  };
  const branch = labels[kind];

  return (
    <figure className="space-y-1 rounded-sm bg-slate-50 p-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">
        El diagrama del condicional
      </figcaption>
      <svg viewBox="0 0 420 150" className="w-full max-w-xl" role="img" aria-label={`Condicional: ${branch.time}`}>
        <rect x="8" y="18" width="120" height="40" rx="6" className="fill-indigo-600" />
        <text x="68" y="43" textAnchor="middle" className="fill-white text-[11px] font-semibold">
          SI (condición)
        </text>
        <text x="68" y="74" textAnchor="middle" className="fill-slate-700 text-[10px]">
          {branch.condition}
        </text>

        <path d="M128 38 H170" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" />
        <path d="M164 33 L172 38 L164 43" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" />

        <rect x="176" y="18" width="120" height="40" rx="6" className="fill-slate-200" />
        <text x="236" y="43" textAnchor="middle" className="fill-slate-800 text-[11px] font-semibold">
          ENTONCES (resultado)
        </text>
        <text x="236" y="74" textAnchor="middle" className="fill-slate-700 text-[10px]">
          {branch.result}
        </text>

        <path d="M296 38 H336" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" />
        <path d="M330 33 L338 38 L330 43" stroke="currentColor" className="text-slate-400" strokeWidth="2" fill="none" />
        <circle cx="356" cy="38" r="18" className="fill-emerald-500" />
        <text x="356" y="42" textAnchor="middle" className="fill-white text-[10px] font-bold">
          →
        </text>

        <rect x="8" y="94" width="404" height="46" rx="6" className="fill-white stroke-slate-200" />
        <text x="20" y="112" className="fill-slate-500 text-[10px] uppercase tracking-widest">
          cuándo se usa
        </text>
        <text x="20" y="130" className="fill-slate-800 text-[11px]">
          {branch.time} · la condición se evalúa primero, siempre
        </text>
      </svg>
    </figure>
  );
}

/** A small bar chart with the trend a data-commentary lesson teaches you to describe. */
export function DataBars({
  values,
  labels,
  caption,
}: {
  values: number[];
  labels: string[];
  caption: string;
}) {
  const max = Math.max(...values, 1);
  const width = 420;
  const height = 140;
  const barWidth = Math.min(48, (width - 40) / values.length - 10);

  return (
    <figure className="space-y-1 rounded-sm bg-slate-50 p-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-slate-500">
        Cómo se comenta un gráfico
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xl" role="img" aria-label={caption}>
        <line x1="28" y1="112" x2={width - 8} y2="112" stroke="currentColor" className="text-slate-300" strokeWidth="1.5" />
        {values.map((value, index) => {
          const barHeight = Math.max(4, (value / max) * 82);
          const x = 36 + index * ((width - 48) / values.length);
          return (
            <g key={`${labels[index]}-${index}`}>
              <rect
                x={x}
                y={112 - barHeight}
                width={barWidth}
                height={barHeight}
                rx="3"
                className={index === values.length - 1 ? "fill-indigo-600" : "fill-indigo-200"}
              />
              <text x={x + barWidth / 2} y={126} textAnchor="middle" className="fill-slate-500 text-[9px]">
                {labels[index]}
              </text>
              <text x={x + barWidth / 2} y={108 - barHeight} textAnchor="middle" className="fill-slate-700 text-[9px]">
                {value}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-slate-600">{caption}</p>
    </figure>
  );
}

/** The B1 → B2/C1 contrast as two columns, which is how the upgrade actually feels. */
export function UpgradeTable({
  rows,
}: {
  rows: { area: string; before: string; after: string; example: string }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-slate-400">
            <th className="py-1 pr-3 font-medium">Área</th>
            <th className="py-1 pr-3 font-medium">Dejá de hacer (B1)</th>
            <th className="py-1 pr-3 font-medium">Empezá a hacer (B2/C1)</th>
            <th className="py-1 font-medium">Cómo suena</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.area} className="border-t border-slate-100 align-top">
              <td className="py-2 pr-3 font-semibold text-slate-900">{row.area}</td>
              <td className="py-2 pr-3">
                <span className="rounded-sm bg-rose-50 px-1.5 py-0.5 text-rose-800">{row.before}</span>
              </td>
              <td className="py-2 pr-3">
                <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-emerald-800">{row.after}</span>
              </td>
              <td className="py-2 text-slate-600">{row.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The opening quote: a voice before the grammar, tied to the module it belongs to. */
export function QuoteBanner({ quote, module: moduleName, title }: { quote: string; module: string; title: string }) {
  return (
    <figure className="relative overflow-hidden rounded-lg border border-indigo-200 bg-indigo-50/70 px-5 py-4">
      <span aria-hidden="true" className="absolute -left-1 top-0 select-none font-serif text-6xl leading-none text-indigo-200">
        “
      </span>
      <blockquote className="relative pl-6">
        <p className="text-base font-medium leading-relaxed text-slate-900">{quote}</p>
        <figcaption className="mt-2 text-[11px] uppercase tracking-widest text-indigo-700">
          {moduleName} · {title}
        </figcaption>
      </blockquote>
    </figure>
  );
}

/** Wraps a paragraph list with room to breathe: the owner called the text cramped. */
export function AiryProse({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="space-y-4 max-w-prose">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="text-[15px] leading-8 text-slate-800">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export type Diagram = { kind: "conditional"; variant: "zero" | "first" | "second" | "third" } | { kind: "bars" };

/** Decides which drawing a lesson gets, from its own title and text. */
export function diagramFor(title: string, body: string): Diagram | null {
  const text = `${title} ${body}`.toLowerCase();
  if (/data commentary|results|statistics|charts|trend/.test(text)) return { kind: "bars" };
  if (/zero conditional|first conditional|second conditional|third conditional|mixed conditional/.test(text)) {
    if (/third|mixed/.test(text)) return { kind: "conditional", variant: "third" };
    if (/second/.test(text)) return { kind: "conditional", variant: "second" };
    if (/first/.test(text)) return { kind: "conditional", variant: "first" };
    return { kind: "conditional", variant: "zero" };
  }
  if (/conditional/.test(text)) return { kind: "conditional", variant: "first" };
  return null;
}

export function DiagramBlock({ diagram }: { diagram: Diagram }): ReactNode {
  if (diagram.kind === "conditional") return <ConditionalFlow kind={diagram.variant} />;
  return (
    <DataBars
      values={[12, 18, 15, 27, 34]}
      labels={["Q1", "Q2", "Q3", "Q4", "Q5"]}
      caption="Los pilotos clínicos por trimestre se duplicaron en el último año: describe el salto, no cada barra."
    />
  );
}

/**
 * The four forms of one idea, side by side.
 *
 * This is the block that answers "what is it and when do I use it" for do-support:
 * the same sentence in neutral, emphatic, negative and question form, plus the two
 * places where `do` must not appear. Reading them in a column is faster than any
 * paragraph about them.
 */
export function DoSupportGrid() {
  const rows = [
    {
      label: "Neutral",
      example: "I have the clinical data.",
      when: "You inform. No doubt on the table.",
      tone: "border-slate-200 bg-white text-slate-800",
    },
    {
      label: "Emphatic",
      example: "I DO have the clinical data.",
      when: "Someone doubted it, or you insist. The stress falls on do.",
      tone: "border-indigo-300 bg-indigo-50/70 text-slate-900",
    },
    {
      label: "Negative",
      example: "I don't have the clinical data.",
      when: "You deny it. Never 'I have not the data'.",
      tone: "border-rose-200 bg-rose-50/60 text-slate-800",
    },
    {
      label: "Question",
      example: "Do you have the clinical data?",
      when: "You ask. Do moves to the front, the verb stays in base form.",
      tone: "border-emerald-200 bg-emerald-50/60 text-slate-800",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">One sentence, four jobs</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className={`space-y-1 rounded-sm border p-3 ${row.tone}`}>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">{row.label}</p>
            <p className="text-sm font-medium">{row.example}</p>
            <p className="text-xs text-slate-600">{row.when}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-sm border border-slate-200 p-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Never with do</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-700">
            <li>
              ❌ I do am ready · ✅ <b>I am ready</b> (be never takes do)
            </li>
            <li>
              ❌ I do can help · ✅ <b>I can help</b> (modals never take do)
            </li>
            <li>
              ❌ Have you the data? · ✅ <b>Do you have…?</b> / <b>Have you got…?</b> (UK)
            </li>
          </ul>
        </div>
        <div className="rounded-sm border border-slate-200 p-3">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Where it shows up at work</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-700">
            <li>«We <b>do</b> have FDA clearance for that indication.» — the investor doubted it.</li>
            <li>«I <b>do</b> have one concern about the timeline.» — firm, still polite.</li>
            <li>«— Do you have a minute? / — I <b>do</b> have five.» — accepting with a limit.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
