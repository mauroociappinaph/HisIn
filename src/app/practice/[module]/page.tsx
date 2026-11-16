"use client";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { QuestionDTO, VocabularyDTO, Skill } from "@/shared/types";

const SKILL_BY_MODULE: Record<string, Skill> = {
  vocabulary: "VOCABULARY",
  reading: "READING",
  listening: "LISTENING",
  "business-english": "BUSINESS",
  contracts: "CONTRACTS",
  grammar: "GRAMMAR",
};

function PracticeInner() {
  const params = useParams();
  const module = params.module as string;
  const skill = SKILL_BY_MODULE[module] ?? "VOCABULARY";
  const [level, setLevel] = useState("B1");
  const [vocab, setVocab] = useState<VocabularyDTO[]>([]);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const l = localStorage.getItem("hisin_level") ?? "B1";
    setLevel(l);
    fetch(`/api/vocabulary?module=${module}&level=${l}`).then((r) => r.json()).then(setVocab);
    fetch(`/api/questions?skill=${skill}&level=${l}&limit=10`).then((r) => r.json()).then(setQuestions);
  }, [module, skill]);

  const q = questions[index];

  function grade() {
    let correct = 0;
    questions.forEach((qq) => {
      if (answers[qq.id] === qq.answer) correct++;
    });
    return { correct, total: questions.length };
  }

  if (showResult) {
    const { correct, total } = grade();
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">Resultado práctica</h2>
        <p className="text-xl">
          {correct} / {total} correctas
        </p>
        <button
          onClick={() => {
            setShowResult(false);
            setIndex(0);
            setAnswers({});
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold capitalize">{module} — Práctica ({level})</h2>

      {vocab.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">Vocabulario</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {vocab.map((v) => (
              <div key={v.id} className="p-4 bg-white rounded-xl border shadow-sm">
                <div className="font-bold text-indigo-600">{v.term}</div>
                <div className="text-sm text-slate-700">{v.definition}</div>
                <div className="text-xs text-slate-500 mt-1 italic">{v.example}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && q && (
        <section className="space-y-4">
          <h3 className="font-semibold">Quiz</h3>
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="mb-4">{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    answers[q.id] === opt ? "bg-indigo-100 border-indigo-500" : "hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              disabled={index === 0}
              onClick={() => setIndex((i) => i - 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Anterior
            </button>
            {index < questions.length - 1 ? (
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={() => setShowResult(true)}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Finalizar
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando...</p>}>
      <PracticeInner />
    </Suspense>
  );
}
