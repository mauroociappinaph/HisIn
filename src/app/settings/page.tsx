"use client";

import { useEffect, useState } from "react";
import { ThemeControls } from "@/components/theme";
import type { CefrLevel } from "@/shared/types";

interface ProfileDTO {
  level: CefrLevel;
  goal: string;
  dailyGoal: number;
  xp: number;
  streak: number;
  bestStreak: number;
  itemsToday: number;
  totalItems: number;
  totalCorrect: number;
}

const GOALS = [
  { id: "interviews", label: "Entrevistas técnicas" },
  { id: "investors", label: "Inversores" },
  { id: "clinical", label: "Documentación clínica" },
  { id: "emails", label: "Emails de trabajo" },
  { id: "reading", label: "Leer documentación" },
] as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [goal, setGoal] = useState("interviews");
  const [dailyGoal, setDailyGoal] = useState(10);
  const [level, setLevel] = useState<CefrLevel>("B1");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data: { profile: ProfileDTO }) => {
        if (!active) return;
        setProfile(data.profile);
        setGoal(data.profile.goal);
        setDailyGoal(data.profile.dailyGoal);
        setLevel(data.profile.level);
      })
      .catch(() => {
        if (active) setProfile(null);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaved(false);
    const response = await fetch("/api/progress", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ goal, dailyGoal, level }),
    });
    if (response.ok) {
      const updated = (await response.json()) as ProfileDTO;
      setProfile(updated);
      setSaved(true);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Ajustes</h1>
        <p className="text-sm text-slate-600">Tu progreso vive en la base, no en el navegador.</p>
      </header>

      {profile ? (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-sm bg-white border border-slate-200 px-3 py-2">
            <div className="text-[10px] uppercase text-slate-500">XP</div>
            <div className="text-xl font-bold text-slate-800">{profile.xp}</div>
          </div>
          <div className="rounded-sm bg-white border border-slate-200 px-3 py-2">
            <div className="text-[10px] uppercase text-slate-500">Racha</div>
            <div className="text-xl font-bold text-slate-800">{profile.streak}</div>
          </div>
          <div className="rounded-sm bg-white border border-slate-200 px-3 py-2">
            <div className="text-[10px] uppercase text-slate-500">Mejor</div>
            <div className="text-xl font-bold text-slate-800">{profile.bestStreak}</div>
          </div>
          <div className="rounded-sm bg-white border border-slate-200 px-3 py-2">
            <div className="text-[10px] uppercase text-slate-500">Precisión</div>
            <div className="text-xl font-bold text-slate-800">
              {profile.totalItems === 0 ? "—" : `${Math.round((profile.totalCorrect / profile.totalItems) * 100)}%`}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Objetivo y ritmo</h2>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-600">Para qué estudiás</span>
          <select
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white"
          >
            {GOALS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-600">Meta diaria: {dailyGoal} tarjetas</span>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={dailyGoal}
            onChange={(event) => setDailyGoal(Number(event.target.value))}
            className="w-full accent-indigo-600"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-600">Nivel</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as CefrLevel)}
            className="w-full px-3 py-2 rounded-sm border border-slate-300 bg-white"
          >
            {LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500">
            El nivel también se ajusta solo con lo que respondés; acá lo podés fijar a mano.
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            className="px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Guardar
          </button>
          {saved ? <span className="text-sm text-emerald-600">Guardado</span> : null}
        </div>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Apariencia</h2>
        <p className="text-xs text-slate-500">
          Mismos colores y paletas que HisMia: claro, oscuro, sistema, cuatro paletas y alto contraste.
        </p>
        <ThemeControls />
      </section>
    </div>
  );
}
