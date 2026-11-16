"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResultInner() {
  const sp = useSearchParams();
  const level = sp.get("level") ?? "B1";
  const score = sp.get("score") ?? "0";
  const total = sp.get("total") ?? "0";
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center">
      <h2 className="text-3xl font-bold">Resultado del test</h2>
      <p className="text-xl">
        Nivel asignado: <span className="font-bold text-indigo-600">{level}</span>
      </p>
      <p className="text-slate-600">
        Puntaje: {score} / {total}
      </p>
      <p className="text-slate-600">
        Te recomendamos empezar por los módulos de tu nivel y avanzar gradualmente.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg"
      >
        Ir al dashboard
      </Link>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando...</p>}>
      <ResultInner />
    </Suspense>
  );
}
