"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { levelFromXp } from "@/modules/progress/game";

/**
 * Four destinations, one idea each: what to do now, where to learn, where to
 * review, and how it is going. Grammar is content, not a destination, so it lives
 * inside Estudiar with the rest of the material.
 */
const NAV = [
  { href: "/", label: "Módulos" },
  { href: "/library", label: "Mi vocabulario" },
  { href: "/grammar", label: "Gramática" },
  { href: "/write", label: "Escribir" },
  { href: "/review/vocab", label: "Repasar" },
  { href: "/progress", label: "Progreso" },
] as const;

/**
 * Five destinations, nothing else competing.
 *
 * The old header carried seven links (test, dashboard, review, phrasal verbs,
 * patterns, progress, generator) and every one of them asked for the same
 * attention. "Aprender" is the hub where the rest live.
 */
export function AppNav({
  streak,
  xp,
  context,
}: {
  streak: number;
  xp: number;
  /** "salud · 90 min": the class context, visible and one tap from editing. */
  context?: { discipline: string; minutes: number };
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const focus = params.get("focus") === "1";

  if (focus) return null;

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-xl text-indigo-600 shrink-0">
          HisIn
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-sm text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 shrink-0">
          {context ? (
            <Link
              href="/class"
              className="px-2 py-1 rounded-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
              title="Contexto de clase: disciplina y duración. Cambialo acá."
            >
              {context.discipline} · {context.minutes} min
            </Link>
          ) : null}
          <span title="Racha de días">
            🔥 <span className="font-semibold text-slate-700">{streak}</span>
          </span>
          <span title="Experiencia">
            ⚡ <span className="font-semibold text-slate-700">{xp}</span>
          </span>
          <span
            title={`Nivel ${levelFromXp(xp).level} · faltan ${levelFromXp(xp).remaining} XP para el próximo`}
            className="px-2 py-1 rounded-sm bg-indigo-50 text-indigo-700 font-semibold"
          >
            Nv {levelFromXp(xp).level}
          </span>
        </div>
      </nav>
    </header>
  );
}
