"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { describeDesign } from "@/modules/classroom/design";
import type { ClassDesign, LessonFlow } from "@/modules/classroom/design";

interface PlanDTO {
  id: string;
  topic: string;
  design: ClassDesign;
  flow: LessonFlow;
  createdAt: string;
}

const DISCIPLINES: { id: ClassDesign["discipline"]; label: string }[] = [
  { id: "negocios", label: "Negocios" },
  { id: "salud", label: "Salud" },
  { id: "derecho", label: "Derecho" },
  { id: "ingenieria", label: "Ingeniería" },
  { id: "lenguas", label: "Lenguas" },
];

const LEVELS: { id: ClassDesign["educationLevel"]; label: string }[] = [
  { id: "grado_inicial", label: "Grado inicial" },
  { id: "grado_avanzado", label: "Grado avanzado" },
  { id: "posgrado", label: "Posgrado" },
  { id: "formacion_profesional", label: "Formación profesional" },
];

const MINUTES: ClassDesign["minutes"][] = [45, 60, 90, 120];

function ClassInner() {
  const searchParams = useSearchParams();
  const [design, setDesign] = useState<ClassDesign | null>(null);
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [topic, setTopic] = useState(searchParams.get("tema") ?? "");
  const [plan, setPlan] = useState<PlanDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/class")
      .then((response) => response.json())
      .then((data: { design: ClassDesign; plans: PlanDTO[] }) => {
        if (!active) return;
        setDesign(data.design);
        setPlans(data.plans);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar tu contexto de clase.");
      });
    return () => {
      active = false;
    };
  }, []);

  const saveDesign = useCallback(async (next: ClassDesign) => {
    setDesign(next);
    const response = await fetch("/api/class", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) setError("No pudimos guardar el contexto de clase.");
  }, []);

  const design_ = useCallback(async () => {
    if (!topic.trim()) {
      setError("Escribí el tema de la clase.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/class", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const body = (await response.json()) as { plan?: PlanDTO; error?: string };
      if (!response.ok || !body.plan) {
        setError(body.error ?? "No pudimos diseñar la clase.");
        return;
      }
      setPlan(body.plan);
      setPlans((previous) => [body.plan!, ...previous]);
    } catch {
      setError("No pudimos diseñar la clase.");
    } finally {
      setBusy(false);
    }
  }, [topic]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Diseñar una clase</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          El contexto decide la sesión: la disciplina cambia la tarea de aplicación, el nivel educativo cambia el
          andamiaje y la duración decide cuántos minutos recibe cada fase. Esto es lo que aplica el diseño
          instruccional, también en las lecciones y en la gramática.
        </p>
      </header>

      {design ? (
        <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800">Contexto</h2>
            <span className="text-xs text-slate-500">{describeDesign(design)}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Disciplina</span>
              <select
                value={design.discipline}
                onChange={(event) =>
                  void saveDesign({ ...design, discipline: event.target.value as ClassDesign["discipline"] })
                }
                className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white"
              >
                {DISCIPLINES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Nivel educativo</span>
              <select
                value={design.educationLevel}
                onChange={(event) =>
                  void saveDesign({
                    ...design,
                    educationLevel: event.target.value as ClassDesign["educationLevel"],
                  })
                }
                className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white"
              >
                {LEVELS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Duración</span>
            <div className="flex flex-wrap gap-2">
              {MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={design.minutes === minutes}
                  onClick={() => void saveDesign({ ...design, minutes })}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                    design.minutes === minutes
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
              {(["unica", "semanal"] as const).map((sequence) => (
                <button
                  key={sequence}
                  type="button"
                  aria-pressed={design.sequence === sequence}
                  onClick={() => void saveDesign({ ...design, sequence })}
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                    design.sequence === sequence
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sequence === "unica" ? "Clase única" : "Secuencia semanal"}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">Tema de la sesión</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="present perfect en status updates · negociar una cláusula de responsabilidad"
            aria-label="Tema de la clase"
            className="flex-1 min-w-[240px] px-4 py-2.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="button"
            onClick={() => void design_()}
            disabled={busy}
            className="px-4 py-2.5 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {busy ? "Diseñando…" : "Diseñar la clase"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Podés tomar el tema de{" "}
          <Link href="/grammar" className="text-indigo-600 hover:underline">
            Gramática
          </Link>{" "}
          o de los{" "}
          <Link href="/patterns" className="text-indigo-600 hover:underline">
            patrones
          </Link>
          .
        </p>
        {error ? (
          <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-3 py-2">{error}</p>
        ) : null}
      </section>

      {plan ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900">{plan.topic}</h2>
            <span className="text-xs text-slate-500">{describeDesign(plan.design)}</span>
          </div>

          {plan.flow.prework ? (
            <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-sm px-4 py-3">
              <strong>Antes de la clase:</strong> {plan.flow.prework}
            </p>
          ) : null}

          <ol className="space-y-2">
            {plan.flow.blocks.map((block) => (
              <li key={block.phase} className="rounded-lg bg-white border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{block.title}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-700">
                    {block.minutes} min
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{block.detail}</p>
                <p className="text-xs text-slate-500 mt-1">
                  <strong>Evidencia:</strong> {block.evidence}
                </p>
              </li>
            ))}
          </ol>

          <p className="text-sm bg-slate-50 border border-slate-200 rounded-sm px-4 py-3 text-slate-700">
            <strong>Después:</strong> {plan.flow.transfer}
          </p>
        </section>
      ) : null}

      {plans.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Clases guardadas</h2>
          <ul className="space-y-2">
            {plans.slice(0, 6).map((saved) => (
              <li key={saved.id} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-white border border-slate-200 rounded-sm px-4 py-2">
                <span className="text-slate-800">{saved.topic}</span>
                <span className="text-xs text-slate-500">{describeDesign(saved.design)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function ClassPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-lg bg-white border border-slate-200 animate-pulse" />}>
      <ClassInner />
    </Suspense>
  );
}
