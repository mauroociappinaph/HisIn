"use client";
import { useEffect, useState } from "react";
import type { QuestionDTO } from "@/shared/types";

interface AssessmentSkillResult {
  correct: number;
  total: number;
}

interface AssessmentResult {
  level: string;
  score: number;
  total: number;
  bySkill: Record<string, AssessmentSkillResult>;
}
import Link from "next/link";
import { presentOptions } from "@/shared/lib/presentation";

export default function TestPage() {
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    fetch("/api/assessment/questions")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center py-12">Cargando test...</p>;
  if (result) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold">Tu nivel: {result.level}</h2>
        <p className="text-slate-600">
          Puntaje: {result.score} / {result.total}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(result.bySkill).map(([skill, v]) => (
            <div key={skill} className="p-3 bg-white rounded border">
              <div className="font-medium">{skill}</div>
              <div>
                {v.correct}/{v.total}
              </div>
            </div>
          ))}
        </div>
        <Link
          href={`/result?level=${result.level}&score=${result.score}&total=${result.total}`}
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg"
        >
          Ver plan de estudio
        </Link>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return <p>Sin preguntas.</p>;

  const selected = answers[q.id];

  function renderQuestion(q: QuestionDTO) {
    switch (q.type) {
      case "FILL_BLANK":
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="text-lg mb-4">{q.prompt}</p>
            <input
              type="text"
              value={selected ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value.trim() }))}
              placeholder="Escribe tu respuesta..."
              className="w-full px-4 py-2 rounded border hover:bg-slate-50"
            />
          </div>
        );

      case "TRUE_FALSE":
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="text-lg mb-4">{q.prompt}</p>
            <div className="flex gap-4">
              {["True", "False"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`flex-1 px-4 py-3 rounded border text-lg font-medium ${
                    selected === opt ? "bg-indigo-100 border-indigo-500" : "hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case "LISTENING_MCQ":
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            {q.audioUrl && (
              <audio controls className="mb-4 w-full">
                <source src={q.audioUrl} type="audio/mpeg" />
                Tu navegador no soporta audio.
              </audio>
            )}
            <p className="text-lg mb-4">{q.prompt}</p>
            <div className="space-y-2">
              {presentOptions(q).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    selected === opt ? "bg-indigo-100 border-indigo-500" : "hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      default: // MULTIPLE_CHOICE
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="text-lg mb-4">{q.prompt}</p>
            {q.audioUrl && (
              <audio controls className="mb-4 w-full">
                <source src={q.audioUrl} type="audio/mpeg" />
              </audio>
            )}
            <div className="space-y-2">
              {presentOptions(q).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    selected === opt ? "bg-indigo-100 border-indigo-500" : "hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
    }
  }

  async function submit() {
    setSubmitting(true);
    const payload = {
      answers: Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected })),
    };
    const res = await fetch("/api/assessment/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setResult(data);
    if (typeof window !== "undefined") {
      localStorage.setItem("hisin_level", data.level);
    }
    setSubmitting(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between text-sm text-slate-500">
        <span>
          Pregunta {index + 1} de {questions.length}
        </span>
        <span className="capitalize">{q.type.replace("_", " ").toLowerCase()}</span>
      </div>
      {renderQuestion(q)}
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
            disabled={submitting || Object.keys(answers).length < questions.length}
            onClick={submit}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-40"
          >
            {submitting ? "Enviando..." : "Finalizar test"}
          </button>
        )}
      </div>
    </div>
  );
}