"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DISCIPLINES = [
  { id: "negocios", label: "Negocios" },
  { id: "salud", label: "Salud" },
  { id: "derecho", label: "Derecho" },
  { id: "ingenieria", label: "Ingeniería" },
  { id: "lenguas", label: "Lenguas" },
] as const;

const LEVELS = [
  { id: "grado_inicial", label: "Grado inicial" },
  { id: "grado_avanzado", label: "Grado avanzado" },
  { id: "posgrado", label: "Posgrado" },
  { id: "formacion_profesional", label: "Formación profesional" },
] as const;

const MINUTES = [45, 60, 90, 120] as const;

export interface ContextSnapshot {
  discipline: string;
  educationLevel: string;
  minutes: number;
  sequence: string;
}

/**
 * The class context, editable where it is felt.
 *
 * It used to live only in /class, which is the last place anyone looks. These
 * controls change what the whole app does: which news feeds are read, the
 * examples the engine writes, and how long a practice session is.
 */
export function ContextBar({ initial }: { initial: ContextSnapshot }) {
  const router = useRouter();
  const [design, setDesign] = useState<ContextSnapshot>(initial);
  const [saving, setSaving] = useState(false);

  async function save(next: ContextSnapshot) {
    setDesign(next);
    setSaving(true);
    try {
      await fetch("/api/class", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          discipline: next.discipline,
          educationLevel: next.educationLevel,
          minutes: next.minutes,
          sequence: next.sequence,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg bg-white border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">Tu contexto de clase</h2>
        <span className="text-[11px] text-slate-500">
          {saving ? "Guardando…" : "Cambia lo que la app te muestra y genera"}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-[11px] text-slate-500">Disciplina</span>
          <select
            value={design.discipline}
            onChange={(event) => void save({ ...design, discipline: event.target.value })}
            className="w-full px-2 py-1.5 rounded-sm border border-slate-300 bg-white text-sm"
          >
            {DISCIPLINES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] text-slate-500">Nivel educativo</span>
          <select
            value={design.educationLevel}
            onChange={(event) => void save({ ...design, educationLevel: event.target.value })}
            className="w-full px-2 py-1.5 rounded-sm border border-slate-300 bg-white text-sm"
          >
            {design.educationLevel === "mixto" ? <option value="mixto">Mixto</option> : null}
            {LEVELS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] text-slate-500">Duración</span>
          <select
            value={design.minutes}
            onChange={(event) => void save({ ...design, minutes: Number(event.target.value) })}
            className="w-full px-2 py-1.5 rounded-sm border border-slate-300 bg-white text-sm"
          >
            {MINUTES.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] text-slate-500">Secuencia</span>
          <select
            value={design.sequence}
            onChange={(event) => void save({ ...design, sequence: event.target.value })}
            className="w-full px-2 py-1.5 rounded-sm border border-slate-300 bg-white text-sm"
          >
            <option value="unica">Clase única</option>
            <option value="semanal">Secuencia semanal</option>
          </select>
        </label>
      </div>
    </section>
  );
}
