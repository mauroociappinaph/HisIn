"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOALS = [
  { id: "interviews", label: "Entrevistas técnicas", hint: "explicar procesos y decisiones" },
  { id: "investors", label: "Inversores", hint: "board updates y fundraising" },
  { id: "clinical", label: "Documentación clínica", hint: "FDA, FHIR, evidencia" },
  { id: "emails", label: "Emails de trabajo", hint: "pedir, negociar, seguir" },
  { id: "reading", label: "Leer documentación", hint: "papers y specs sin traducir" },
] as const;

const RHYTHMS = [5, 10, 20] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

/**
 * One screen, three questions, no test.
 *
 * The level test was the only friction between opening the app and practising,
 * and it measured instead of teaching. The level is optional here: it is also
 * derived from what you actually answer from now on.
 */
export function Onboarding({ defaultLevel }: { defaultLevel: string }) {
  const router = useRouter();
  const [goal, setGoal] = useState<string>("interviews");
  const [dailyGoal, setDailyGoal] = useState<number>(10);
  const [level, setLevel] = useState<string | null>(defaultLevel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal, dailyGoal, ...(level ? { level } : {}) }),
      });
      if (!response.ok) {
        setError("No pudimos guardar tus preferencias. Probá de nuevo.");
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos guardar tus preferencias. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Empecemos por lo que te sirve</h1>
        <p className="text-slate-600 text-sm">
          Tres preguntas y arrancás. Sin test de nivel, sin niveles bloqueados: elegís qué practicar, siempre.
        </p>
      </header>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">1. ¿Para qué necesitás el inglés?</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {GOALS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={goal === option.id}
              onClick={() => setGoal(option.id)}
              className={`text-left px-4 py-3 rounded-sm border transition ${
                goal === option.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
              <span className="block text-xs text-slate-500">{option.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">2. ¿Cuánto por día?</h2>
        <div className="flex gap-2">
          {RHYTHMS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={dailyGoal === minutes * 2}
              onClick={() => setDailyGoal(minutes * 2)}
              className={`px-4 py-2 rounded-sm text-sm font-semibold transition ${
                dailyGoal === minutes * 2
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Equivale a unas {dailyGoal} tarjetas por día. Podés cambiarlo cuando quieras.
        </p>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">3. ¿Nivel? (opcional)</h2>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={level === option}
              onClick={() => setLevel(option)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                level === option ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={level === null}
            onClick={() => setLevel("B1")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
              level === "B1" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            no sé todavía
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Si no sabés, arrancamos en B1 y el nivel se ajusta solo según lo que respondés.
        </p>
      </section>

      {error ? (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-3 py-2">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={() => void start()}
        disabled={saving}
        className="w-full px-6 py-3 rounded-sm bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {saving ? "Preparando todo…" : "Empezar a practicar"}
      </button>
    </div>
  );
}
