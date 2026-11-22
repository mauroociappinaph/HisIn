"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

interface DrillItem {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string | null;
}

/**
 * The practice step: four items on the rule you just read, with feedback now.
 *
 * Rule then practice in the same screen is what makes a lesson stick; a link to
 * "practice somewhere else" is where learners drop off. Nothing is stored, so the
 * batch is disposable and always fresh.
 */
export function Drill({ slug }: { slug: string }) {
  const [items, setItems] = useState<DrillItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const start = useCallback(async () => {
    setStatus("loading");
    setItems(null);
    setIndex(0);
    setPicked(null);
    setScore({ right: 0, wrong: 0 });
    try {
      const response = await fetch(`/api/topics/${slug}/drill`, { method: "POST" });
      const payload = (await response.json()) as { items?: DrillItem[]; error?: string };
      if (!response.ok || !payload.items?.length) {
        setStatus("error");
        return;
      }
      setItems(payload.items);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [slug]);

  const item = items?.[index];
  const done = items !== null && index >= items.length;

  const choose = (option: string) => {
    if (picked || !item) return;
    setPicked(option);
    setScore((current) =>
      option === item.answer
        ? { ...current, right: current.right + 1 }
        : { ...current, wrong: current.wrong + 1 },
    );
  };

  if (status === "idle" && !items) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Cuatro preguntas cortas sobre esta regla, en contexto de trabajo real. No se guardan: cada vez que
          entrás son nuevas.
        </p>
        <button
          type="button"
          onClick={() => void start()}
          className="px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition active:scale-95"
        >
          Empezar el ejercicio
        </button>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-sm text-slate-500">Preparando cuatro preguntas…</p>;
  }

  if (status === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-700">No pudimos armar el ejercicio ahora.</p>
        <button
          type="button"
          onClick={() => void start()}
          className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (done) {
    const total = score.right + score.wrong;
    const perfect = score.right === total;
    return (
      <div className="space-y-3">
        <p className="text-lg font-semibold text-slate-900">
          {score.right} de {total} {perfect ? "· perfecto" : ""}
        </p>
        <p className="text-sm text-slate-600">
          {perfect
            ? "La regla está sólida. Pasá al reading y volvé mañana, que ahí se fija."
            : "Mirá otra vez la regla y la trampa del hispanohablante antes de seguir: lo que falla acá vuelve en el repaso."}
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => void start()}
            className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Otra tanda
          </button>
          <Link
            href="/review/vocab"
            className="px-3 py-1.5 rounded-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Ir al repaso
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          Ítem {index + 1} de {items?.length ?? 0}
        </span>
        <span className="flex gap-1" aria-hidden="true">
          {items?.map((entry, dot) => (
            <span
              key={entry.id}
              className={`h-1 w-5 rounded-full ${
                dot < index ? "bg-indigo-500" : dot === index ? "bg-indigo-300" : "bg-slate-200"
              }`}
            />
          ))}
        </span>
      </div>

      <p className="text-sm font-medium text-slate-900">{item?.prompt}</p>

      <div className="grid gap-2">
        {item?.options.map((option) => {
          const isAnswer = option === item.answer;
          const isPicked = option === picked;
          const revealed = Boolean(picked);
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={revealed}
              className={`text-left rounded-sm border px-3 py-2 text-sm transition ${
                revealed && isAnswer
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : revealed && isPicked
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : revealed
                      ? "border-slate-200 bg-white text-slate-500"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.99]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked ? (
        <div className="space-y-2">
          {item?.explanation ? <p className="text-xs text-slate-600">{item.explanation}</p> : null}
          <button
            type="button"
            onClick={() => {
              setIndex((current) => current + 1);
              setPicked(null);
            }}
            className="px-3 py-1.5 rounded-sm bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
          >
            {index + 1 >= (items?.length ?? 0) ? "Ver resultado" : "Siguiente"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
