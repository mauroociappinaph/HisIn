"use client";
import { useEffect, useState } from "react";

export default function ProgressPage() {
  const [level, setLevel] = useState<string>("—");
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    setLevel(localStorage.getItem("hisin_level") ?? "—");
    const raw = localStorage.getItem("hisin_completed");
    setCompleted(raw ? JSON.parse(raw) : []);
  }, []);
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Tu progreso</h2>
      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-2">
        <div>
          <span className="font-medium">Nivel actual: </span>
          <span className="text-indigo-600 font-bold">{level}</span>
        </div>
        <div>
          <span className="font-medium">Lecciones completadas: </span>
          {completed.length}
        </div>
      </div>
      {completed.length > 0 && (
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-2">Lecciones completadas</h3>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            {completed.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => {
          localStorage.removeItem("hisin_completed");
          localStorage.removeItem("hisin_level");
          setCompleted([]);
          setLevel("—");
        }}
        className="px-4 py-2 border rounded text-sm"
      >
        Reiniciar progreso
      </button>
    </div>
  );
}
