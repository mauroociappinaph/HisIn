"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { VocabularyDTO } from "@/shared/types";
import { EntryForm } from "@/components/entry-form";
import { KindTag, LevelBadge, ModuleTag, SpeakButton } from "@/components/vocab-ui";
import { ChipsLegend } from "@/components/chips-legend";

/** What each particle tends to mean, so the list teaches the system and not a list. */
const PARTICLE_MEANINGS: Record<string, string> = {
  up: "completar o aumentar",
  down: "reducir o detener",
  out: "excluir, descubrir o resolver",
  off: "separar, cancelar o terminar",
  on: "continuar o activar",
  in: "entrar o incluir",
  over: "revisar o repetir",
  through: "atravesar hasta el final",
  back: "devolver o responder",
  away: "alejar o guardar",
  after: "cuidar o perseguir",
  for: "buscar o esperar",
  with: "acompañar o tolerar",
};

const TABS = [
  { kind: "PHRASAL_VERB", label: "Phrasal verbs" },
  { kind: "IDIOM", label: "Expresiones" },
] as const;

function ChunksInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<(typeof TABS)[number]["kind"]>(
    searchParams.get("tipo") === "expresiones" ? "IDIOM" : "PHRASAL_VERB",
  );
  const [entries, setEntries] = useState<VocabularyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [particle, setParticle] = useState<string>("all");

  useEffect(() => {
    let active = true;
    fetch(`/api/vocabulary?kind=${tab}`)
      .then((response) => response.json())
      .then((data: VocabularyDTO[]) => {
        if (active) setEntries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setEntries([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab]);

  const particles = useMemo(() => {
    const seen = new Map<string, number>();
    for (const entry of entries) {
      const key = entry.particle ?? "otras";
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const filtered = useMemo(
    () => (particle === "all" ? entries : entries.filter((entry) => (entry.particle ?? "otras") === particle)),
    [entries, particle],
  );
  // The counts above stay exact because the whole list is loaded; only the
  // rendering is windowed, so nobody scrolls 60 cards to find yesterday's word.
  const [shown, setShown] = useState(12);
  const visible = filtered.slice(0, shown);

  const remove = useCallback(async (entry: VocabularyDTO) => {
    if (!window.confirm(`¿Borrar "${entry.term}" de tus phrasal verbs?`)) return;
    const response = await fetch(`/api/vocabulary/${entry.id}`, { method: "DELETE" });
    if (response.ok) {
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
    }
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 md:p-6 shadow-lg shadow-amber-500/20">
        <span className="text-[11px] uppercase tracking-widest text-white/75">Léxico que se mueve</span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Phrasal verbs y expresiones</h1>
        <p className="text-white/85 max-w-2xl text-sm mt-1">
          Agrupados por partícula, con separabilidad y registro: la partícula cambia el significado, y saber si el
          objeto va en el medio evita el error más común (<span className="font-mono">turn it off</span>, nunca{" "}
          <span className="font-mono">turn off it</span>).
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((option) => (
          <button
            key={option.kind}
            type="button"
            aria-pressed={tab === option.kind}
            onClick={() => {
              setLoading(true);
              setParticle("all");
              setTab(option.kind);
            }}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
              tab === option.kind
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <ChipsLegend />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParticle("all")}
            aria-pressed={particle === "all"}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              particle === "all" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            Todas ({entries.length})
          </button>
          {particles.map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setParticle(key)}
              aria-pressed={particle === key}
              title={PARTICLE_MEANINGS[key] ?? "partícula poco frecuente"}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                particle === key ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {key} ({count})
            </button>
          ))}
        </div>
        <EntryForm
          kinds={tab === "IDIOM" ? ["IDIOM"] : ["PHRASAL_VERB"]}
          defaultModule="business-english"
          onCreated={(entry) => setEntries((previous) => [entry, ...previous])}
        />
      </div>

      {particle !== "all" && PARTICLE_MEANINGS[particle] ? (
        <p className="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <span className="font-mono font-semibold">{particle}</span> suele marcar «{PARTICLE_MEANINGS[particle]}».
        </p>
      ) : null}

      {loading ? (
        <p className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
          Cargando phrasal verbs…
        </p>
      ) : visible.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
          <p className="text-slate-700 font-medium">Todavía no hay phrasal verbs con esa partícula.</p>
          <p className="text-sm text-slate-500">
            Podés agregarlos a mano arriba, o pedirle al motor que genere contenido en{" "}
            <Link href="/studio" className="text-indigo-600 hover:underline">
              /studio
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-amber-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <KindTag kind={entry.kind} />
                  <LevelBadge level={entry.level} />
                  <ModuleTag module={entry.module} />
                  {entry.separable === undefined ? null : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                      {entry.separable ? "separable" : "insegparable"}
                    </span>
                  )}
                  {entry.register ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                      {entry.register}
                    </span>
                  ) : null}
                  {entry.source === "USER" ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      propia
                    </span>
                  ) : null}
                </div>
                <SpeakButton text={entry.term} label={`Escuchar ${entry.term}`} />
              </div>

              <h2 className="text-xl font-bold text-slate-900 break-words">{entry.term}</h2>
              <p className="text-sm text-slate-700">{entry.definition}</p>
              <p className="text-sm italic text-slate-500 border-l-2 border-amber-200 pl-3">{entry.example}</p>

              {entry.notes ? <p className="text-xs text-slate-500">📎 {entry.notes}</p> : null}

              {entry.source === "USER" ? (
                <button
                  type="button"
                  onClick={() => void remove(entry)}
                  className="mt-auto self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Borrar
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {!loading && shown < filtered.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShown((value) => value + 12)}
            className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
          >
            Mostrar más ({filtered.length - shown} restantes)
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function PhrasalVerbsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-lg bg-white border border-slate-200 animate-pulse" />}>
      <ChunksInner />
    </Suspense>
  );
}
