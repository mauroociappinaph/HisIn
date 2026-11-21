"use client";
import { useEffect, useState } from "react";
import type { ModuleDTO } from "@/shared/types";
import Link from "next/link";

export default function DashboardPage() {
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [level, setLevel] = useState<string>("B1");
  useEffect(() => {
    let active = true;
    void (async () => {
      const data = (await fetch("/api/modules").then((r) => r.json())) as ModuleDTO[];
      const storedLevel = localStorage.getItem("hisin_level");
      if (!active) return;
      setModules(data);
      if (storedLevel) setLevel(storedLevel);
    })();
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
          Nivel: {level}
        </span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <div key={m.id} className="p-6 bg-white rounded-xl border shadow-sm space-y-3">
            <div className="text-3xl">{m.icon}</div>
            <h3 className="font-semibold text-lg">{m.name}</h3>
            <p className="text-sm text-slate-600">{m.description}</p>
            <div className="flex gap-2">
              <Link
                href={`/lessons/${m.slug}`}
                className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded text-sm"
              >
                Lecciones
              </Link>
              <Link
                href={`/practice/${m.slug}`}
                className="flex-1 text-center px-3 py-2 border border-indigo-600 text-indigo-600 rounded text-sm"
              >
                Practicar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
