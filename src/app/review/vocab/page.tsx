"use client";
import { Suspense, useEffect, useState } from "react";
import type { VocabularyDTO } from "@/shared/types";
import Link from "next/link";

interface VocabReviewItem {
  id: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  vocabulary: VocabularyDTO;
}

interface ReviewStats {
  total: number;
  due: number;
  learning: number;
  mature: number;
}

function ReviewInner() {
  const [items, setItems] = useState<VocabReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ total: 0, due: 0, learning: 0, mature: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  async function fetchReviewData() {
    const [dueRes, statsRes] = await Promise.all([
      fetch("/api/srs/vocab/due?limit=20"),
      fetch("/api/srs/vocab/stats"),
    ]);
    const dueData = (await dueRes.json()) as VocabReviewItem[];
    const statsData = (await statsRes.json()) as ReviewStats;
    return { dueData, statsData };
  }

  async function loadData() {
    setLoading(true);
    try {
      const { dueData, statsData } = await fetchReviewData();
      setItems(dueData);
      setStats(statsData);
      setCurrentIndex(0);
      setShowAnswer(false);
    } catch (e) {
      console.error("Failed to load review data:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { dueData, statsData } = await fetchReviewData();
        if (!active) return;
        setItems(dueData);
        setStats(statsData);
      } catch (e) {
        console.error("Failed to load review data:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const current = items[currentIndex];

  async function submitReview(q: number) {
    if (!current) return;
    setReviewing(true);
    try {
      await fetch("/api/srs/vocab/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabularyId: current.vocabulary.id,
          quality: q,
        }),
      });
      // Move to next or reload if done
      if (currentIndex < items.length - 1) {
        setCurrentIndex((i) => i + 1);
        setShowAnswer(false);
      } else {
        await loadData();
      }
    } catch (e) {
      console.error("Review failed:", e);
    }
    setReviewing(false);
  }

  if (loading) return <p className="text-center py-12">Cargando repaso...</p>;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-2xl font-bold">Repaso de vocabulario</h2>
        <p className="text-slate-600">
          ¡No hay palabras para repasar ahora! Vuelve más tarde.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-white rounded border">
            <div className="font-medium">Total aprendido</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="font-medium">Maduros (21+ días)</div>
            <div className="text-2xl font-bold text-green-600">{stats.mature}</div>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg"
        >
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Repaso SRS</h2>
        <div className="text-sm text-slate-500">
          {currentIndex + 1} / {items.length}
        </div>
      </div>

      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{current.vocabulary.term}</span>
            <span className="text-sm text-slate-500 capitalize">{current.vocabulary.level}</span>
            <span className="text-xs px-2 py-1 bg-slate-100 rounded">
              Rep: {current.repetitions} • Intervalo: {current.interval}d • EF: {current.easeFactor.toFixed(2)}
            </span>
          </div>
          <p className="text-slate-700">{current.vocabulary.definition}</p>
          <p className="text-sm text-slate-500 italic mt-1">{current.vocabulary.example}</p>
        </div>

        {!showAnswer ? (
          <div className="space-y-4">
            <p className="text-slate-600">¿Recuerdas el significado? Intenta recordarlo antes de voltear.</p>
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Mostrar respuesta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border">
              <p className="font-semibold text-slate-700">{current.vocabulary.definition}</p>
              <p className="text-sm text-slate-500 italic mt-1">{current.vocabulary.example}</p>
            </div>
            <p className="text-sm text-slate-600">
              ¿Qué tan fácil fue recordarlo? (0 = nada, 5 = perfecto)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { q: 0, label: "Nada (0)", color: "bg-red-600" },
                { q: 1, label: "Muy difícil (1)", color: "bg-red-500" },
                { q: 2, label: "Difícil (2)", color: "bg-orange-500" },
                { q: 3, label: "Con esfuerzo (3)", color: "bg-yellow-500" },
                { q: 4, label: "Fácil (4)", color: "bg-lime-500" },
                { q: 5, label: "Perfecto (5)", color: "bg-green-600" },
              ].map(({ q, label, color }) => (
                <button
                  key={q}
                  onClick={() => submitReview(q)}
                  disabled={reviewing}
                  className={`px-3 py-2 rounded text-white text-sm font-medium ${color} hover:opacity-90 disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="flex-1 text-center px-4 py-2 border rounded"
        >
          Volver
        </Link>
        <Link
          href="/practice/vocabulary"
          className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Practicar más
        </Link>
      </div>
    </div>
  );
}

export default function VocabReviewPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando...</p>}>
      <ReviewInner />
    </Suspense>
  );
}