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

const DISCIPLINES = [
  { id: "negocios", label: "Negocios" },
  { id: "salud", label: "Salud" },
  { id: "derecho", label: "Derecho" },
  { id: "ingenieria", label: "Ingeniería" },
  { id: "lenguas", label: "Lenguas" },
] as const;

const EDUCATION = [
  { id: "grado_inicial", label: "Grado inicial" },
  { id: "grado_avanzado", label: "Grado avanzado" },
  { id: "posgrado", label: "Posgrado" },
  { id: "formacion_profesional", label: "Formación profesional" },
] as const;

const CLASS_MINUTES = [45, 60, 90, 120] as const;

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
  const [discipline, setDiscipline] = useState<string>("negocios");
  const [educationLevel, setEducationLevel] = useState<string>("grado_inicial");
  const [mixed, setMixed] = useState(false);
  const [mixA, setMixA] = useState(60);
  const [classMinutes, setClassMinutes] = useState<number>(60);
  const [sequence, setSequence] = useState<"unica" | "semanal">("semanal");
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

      const design = await fetch("/api/class", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          discipline,
          educationLevel: mixed ? "mixto" : educationLevel,
          ...(mixed ? { educationMix: { grado_inicial: mixA, posgrado: 100 - mixA } } : {}),
          minutes: classMinutes,
          sequence,
        }),
      });
      if (!design.ok) {
        setError("Guardamos tus preferencias, pero no el contexto de clase.");
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

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">4. Tu contexto de clase</h2>
        <p className="text-xs text-slate-500">
          Con esto se arman los planes, las lecciones y el tamaño de cada sesión de práctica.
        </p>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-600">Disciplina</span>
          <select
            value={discipline}
            onChange={(event) => setDiscipline(event.target.value)}
            className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white"
          >
            {DISCIPLINES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-600">Nivel educativo</span>
          <select
            value={educationLevel}
            onChange={(event) => setEducationLevel(event.target.value)}
            disabled={mixed}
            className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white disabled:opacity-50"
          >
            {EDUCATION.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={mixed}
              onChange={(event) => setMixed(event.target.checked)}
              className="accent-indigo-600"
            />
            Es un grupo mixto
          </label>
          {mixed ? (
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <label className="flex items-center gap-2">
                Grado inicial
                <input
                  type="number"
                  min={10}
                  max={90}
                  step={10}
                  value={mixA}
                  onChange={(event) => setMixA(Number(event.target.value))}
                  className="w-16 px-2 py-1 rounded-sm border border-slate-300"
                />
                %
              </label>
              <span>Posgrado {100 - mixA}%</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Duración de la clase</span>
          <div className="flex flex-wrap gap-2">
            {CLASS_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={classMinutes === minutes}
                onClick={() => setClassMinutes(minutes)}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                  classMinutes === minutes
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Secuencia</span>
          <div className="flex gap-2">
            {(["unica", "semanal"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={sequence === option}
                onClick={() => setSequence(option)}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                  sequence === option
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option === "unica" ? "Clase única" : "Secuencia semanal"}
              </button>
            ))}
          </div>
        </div>
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
