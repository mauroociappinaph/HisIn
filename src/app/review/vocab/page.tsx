"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import type { VocabularyDTO } from "@/shared/types";
import { ChallengeMode } from "./_components/ChallengeMode";
import { ExploreMode } from "./_components/ExploreMode";
import { ReviewMode } from "./_components/ReviewMode";
import { StoryMode } from "./_components/StoryMode";
import { ProgressBar, Stat } from "./_components/ui";
import { getTrainerServerSnapshot, getTrainerSnapshot, subscribeTrainer, toggleKnown } from "./_components/store";
import type { ReviewStats, TrainerMode, VocabReviewItem } from "./_components/types";

const TOAST_MS = 2200;

const MODES: { id: TrainerMode; label: string; icon: string }[] = [
  { id: "review", label: "Repaso SRS", icon: "🧠" },
  { id: "explore", label: "Explorar", icon: "🗂️" },
  { id: "challenge", label: "Desafío", icon: "⚡" },
  { id: "stories", label: "Historias", icon: "📖" },
];

type ToastTone = "success" | "info" | "warning";

const EMPTY_STATS: ReviewStats = { total: 0, due: 0, learning: 0, mature: 0 };

async function fetchReviewData(): Promise<{ due: VocabReviewItem[]; stats: ReviewStats }> {
  const [dueResponse, statsResponse] = await Promise.all([
    fetch("/api/srs/vocab/due?limit=20"),
    fetch("/api/srs/vocab/stats"),
  ]);
  return {
    due: (await dueResponse.json()) as VocabReviewItem[],
    stats: (await statsResponse.json()) as ReviewStats,
  };
}

interface ProfileDTO {
  xp: number;
  streak: number;
  bestStreak: number;
  level: string;
  itemsToday: number;
  dailyGoal: number;
}

function TrainerInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<TrainerMode>(
    searchParams.get("modo") === "historias" ? "stories" : "review",
  );
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [bank, setBank] = useState<VocabularyDTO[]>([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [due, setDue] = useState<VocabReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);

  const local = useSyncExternalStore(subscribeTrainer, getTrainerSnapshot, getTrainerServerSnapshot);
  const known = useMemo(() => new Set(local.known), [local.known]);
  const score = {
    xp: profile?.xp ?? 0,
    streak: profile?.streak ?? 0,
    best: profile?.bestStreak ?? 0,
  };

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;
    fetch("/api/progress")
      .then((response) => response.json())
      .then((data: { profile: ProfileDTO }) => {
        if (active) setProfile(data.profile);
      })
      .catch(() => {
        if (active) setProfile(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const record = useCallback(
    async (event: { event: "practice" | "review" | "story"; items: number; correct: number; xp: number }) => {
      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(event),
        });
        if (response.ok) setProfile((await response.json()) as ProfileDTO);
      } catch {
        // A failed counter must never block the practice the learner is doing.
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/vocabulary/all")
      .then((response) => response.json())
      .then((data: VocabularyDTO[]) => {
        if (!active) return;
        setBank(Array.isArray(data) ? data : []);
      })
      .catch((error: unknown) => {
        console.error("Failed to load vocabulary:", error);
        if (active) showToast("No pudimos cargar el vocabulario", "warning");
      })
      .finally(() => {
        if (active) setBankLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  useEffect(() => {
    let active = true;
    fetchReviewData()
      .then((data) => {
        if (!active) return;
        setDue(data.due);
        setStats(data.stats);
      })
      .catch((error: unknown) => {
        console.error("Failed to load review data:", error);
        if (active) showToast("No pudimos cargar el repaso", "warning");
      })
      .finally(() => {
        if (active) setReviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  /** Event handler: persists one SRS grade; the SM-2 math lives in the API. */
  const gradeVocabulary = useCallback(
    async (vocabularyId: string, quality: number) => {
      const response = await fetch("/api/srs/vocab/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyId, quality }),
      });
      if (!response.ok) {
        showToast("No pudimos guardar ese repaso", "warning");
        throw new Error(`Review failed with ${response.status}`);
      }
      await record({ event: "review", items: 1, correct: quality >= 3 ? 1 : 0, xp: quality >= 3 ? 10 : 2 });
    },
    [record, showToast],
  );

  /** Event handler: refetches due words and stats after a finished session. */
  const reloadReview = useCallback(async () => {
    setReviewLoading(true);
    try {
      const data = await fetchReviewData();
      setDue(data.due);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to reload review data:", error);
      showToast("No pudimos cargar el repaso", "warning");
    } finally {
      setReviewLoading(false);
    }
  }, [showToast]);

  const matureRatio = stats.total === 0 ? 0 : Math.round((stats.mature / stats.total) * 100);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white p-5 md:p-6 shadow-lg shadow-indigo-600/20">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-white/70">
              Vocabulario
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Entrenador de vocabulario</h1>
            <p className="text-white/80 max-w-lg text-sm">
              Repaso espaciado real sobre tu banco de HisIn, con explorador de tarjetas y desafío rápido para
              reforzar cada palabra en contexto.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white/15">
              <div className="text-[10px] uppercase tracking-wide text-white/70">XP</div>
              <div className="text-lg font-bold">{score.xp}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/15">
              <div className="text-[10px] uppercase tracking-wide text-white/70">Racha</div>
              <div className="text-lg font-bold">{score.streak}</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/15">
              <div className="text-[10px] uppercase tracking-wide text-white/70">Mejor</div>
              <div className="text-lg font-bold">{score.best}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/75">
            <span>
              {stats.due} {stats.due === 1 ? "pendiente" : "pendientes"} hoy · {stats.total} en repaso
            </span>
            <span>{matureRatio}% maduras</span>
          </div>
          <ProgressBar value={matureRatio} onDark />
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Banco total" value={bank.length} hint="palabras cargadas" />
        <Stat label="Pendientes hoy" value={stats.due} />
        <Stat label="Aprendiendo" value={stats.learning} />
        <Stat label="Maduras" value={stats.mature} hint="21+ días" />
      </div>

      <div role="tablist" aria-label="Modos del entrenador" className="flex flex-wrap gap-2">
        {MODES.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(item.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                active
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <span aria-hidden="true" className="mr-1.5">
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === "review" ? (
        <ReviewMode
          loading={reviewLoading}
          items={due}
          onGrade={gradeVocabulary}
          onReload={reloadReview}
          onSwitchMode={setMode}
        />
      ) : null}

      {mode === "explore" ? (
        <ExploreMode
          bank={bank}
          loading={bankLoading}
          recentlyMastered={known}
          onToggleMastered={toggleKnown}
          onCreated={(entry) => setBank((previous) => [entry, ...previous])}
        />
      ) : null}

      {mode === "stories" ? <StoryMode /> : null}

      {mode === "challenge" ? (
        <ChallengeMode
          bank={bank}
          loading={bankLoading}
          score={score}
          onAnswered={(gained, correct) =>
            void record({ event: "practice", items: 1, correct: correct ? 1 : 0, xp: gained })
          }
          onToast={showToast}
        />
      ) : null}


      <div aria-live="polite" className="fixed bottom-6 right-6 z-20">
        {toast ? (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${
              toast.tone === "warning"
                ? "bg-amber-600"
                : toast.tone === "info"
                  ? "bg-indigo-600"
                  : "bg-emerald-600"
            }`}
          >
            {toast.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function VocabTrainerPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-lg bg-white border border-slate-200 animate-pulse" />}>
      <TrainerInner />
    </Suspense>
  );
}
