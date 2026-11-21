"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { CefrLevel, QuestionDTO, VocabularyDTO, Skill } from "@/shared/types";
import { presentOptions, resolveLevel } from "@/shared/lib/presentation";

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
  const moduleSlug = params.module as string;
  const skill = SKILL_BY_MODULE[moduleSlug] ?? "VOCABULARY";
  const [level, setLevel] = useState("B1");
  const [requestedLevel, setRequestedLevel] = useState<string | null>(null);
  const [vocab, setVocab] = useState<VocabularyDTO[]>([]);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      // The learner level lives in Postgres now; localStorage was erased by a
      // cleared browser and froze the level forever.
      const progress = (await fetch("/api/progress").then((r) => r.json())) as {
        profile: { level: string };
      };
      const storedLevel = (progress.profile?.level ?? "B1") as CefrLevel;
      // The full module vocabulary comes back at once so a level without its own
      // content can fall back to the closest available level, in the page.
      const [vocabData, questionData] = await Promise.all([
        fetch(`/api/vocabulary?module=${moduleSlug}`).then((r) => r.json()),
        fetch(`/api/questions?skill=${skill}&level=${storedLevel}&limit=10`).then((r) => r.json()),
      ]);
      if (!active) return;

      const shownVocab = vocabData as VocabularyDTO[];
      let shownQuestions = questionData as QuestionDTO[];
      let quizLevel: CefrLevel | null = shownQuestions.length > 0 ? storedLevel : null;
      if (shownQuestions.length === 0) {
        // No questions at the requested level yet: use the closest level that
        // actually has questions for this skill.
        const allQuestions = (await fetch(`/api/questions?skill=${skill}`).then(
          (r) => r.json(),
        )) as QuestionDTO[];
        if (!active) return;
        const questionTarget = resolveLevel(
          storedLevel,
          [...new Set(allQuestions.map((q) => q.level))],
        );
        if (questionTarget) {
          shownQuestions = allQuestions.filter((q) => q.level === questionTarget).slice(0, 10);
          quizLevel = questionTarget;
        }
      }

      const vocabLevel = resolveLevel(storedLevel, [...new Set(shownVocab.map((v) => v.level))]);
      const displayedVocab = vocabLevel
        ? shownVocab.filter((v) => v.level === vocabLevel)
        : [];
      const effectiveLevel = quizLevel ?? vocabLevel ?? storedLevel;

      setLevel(effectiveLevel);
      setRequestedLevel(effectiveLevel === storedLevel ? null : storedLevel);
      setVocab(displayedVocab);
      setQuestions(shownQuestions);
    })();
    return () => {
      active = false;
    };
  }, [moduleSlug, skill]);

  const q = questions[index];

  function grade() {
    let correct = 0;
    questions.forEach((qq) => {
      if (answers[qq.id] === qq.answer) correct++;
    });
    return { correct, total: questions.length };
  }

  function renderQuestion(q: QuestionDTO) {
    const selected = answers[q.id];
    const isCorrect = selected === q.answer;
    const showAnswer = selected !== undefined;

    switch (q.type) {
      case "FILL_BLANK":
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="mb-4">{q.prompt}</p>
            <input
              type="text"
              value={selected ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value.trim() }))}
              placeholder="Escribe tu respuesta..."
              className={`w-full px-4 py-2 rounded border ${
                showAnswer
                  ? isCorrect
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                  : "hover:bg-slate-50"
              }`}
              disabled={showAnswer}
            />
            {showAnswer && q.explanation && (
              <p className="mt-3 text-sm text-slate-600">{q.explanation}</p>
            )}
            {showAnswer && !isCorrect && q.answer && (
              <p className="mt-2 text-sm text-red-600">Correcto: {q.answer}</p>
            )}
          </div>
        );

      case "TRUE_FALSE":
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="mb-4">{q.prompt}</p>
            <div className="flex gap-4">
              {["True", "False"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => !showAnswer && setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`flex-1 px-4 py-3 rounded border text-lg font-medium ${
                    selected === opt
                      ? isCorrect
                        ? "bg-green-100 border-green-500 text-green-800"
                        : "bg-red-100 border-red-500 text-red-800"
                      : "hover:bg-slate-50"
                  }`}
                  disabled={showAnswer}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showAnswer && q.explanation && (
              <p className="mt-3 text-sm text-slate-600">{q.explanation}</p>
            )}
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
            <p className="mb-4">{q.prompt}</p>
            <div className="space-y-2">
              {presentOptions(q).map((opt) => (
                <button
                  key={opt}
                  onClick={() => !showAnswer && setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    selected === opt
                      ? isCorrect
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 border-red-500"
                      : "hover:bg-slate-50"
                  }`}
                  disabled={showAnswer}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showAnswer && q.explanation && (
              <p className="mt-3 text-sm text-slate-600">{q.explanation}</p>
            )}
          </div>
        );

      default: // MULTIPLE_CHOICE
        return (
          <div className="p-6 bg-white rounded-xl border shadow-sm">
            <p className="mb-4">{q.prompt}</p>
            {q.audioUrl && (
              <audio controls className="mb-4 w-full">
                <source src={q.audioUrl} type="audio/mpeg" />
              </audio>
            )}
            <div className="space-y-2">
              {presentOptions(q).map((opt) => (
                <button
                  key={opt}
                  onClick={() => !showAnswer && setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={`w-full text-left px-4 py-2 rounded border ${
                    selected === opt
                      ? isCorrect
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 border-red-500"
                      : "hover:bg-slate-50"
                  }`}
                  disabled={showAnswer}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showAnswer && q.explanation && (
              <p className="mt-3 text-sm text-slate-600">{q.explanation}</p>
            )}
          </div>
        );
    }
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
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/learn" className="hover:text-indigo-600">
          Aprender
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/lessons/${moduleSlug}`} className="capitalize hover:text-indigo-600">
          {moduleSlug}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">Práctica</span>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold capitalize">{moduleSlug} — Práctica ({level})</h2>
        <Link
          href={`/practice/${moduleSlug}?focus=1`}
          className="text-xs px-3 py-1.5 rounded-sm border border-slate-300 font-medium hover:border-indigo-300"
        >
          Modo foco
        </Link>
      </div>
      {requestedLevel && requestedLevel !== level && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          No hay contenido {requestedLevel} todavía; estás practicando con {level}.
        </p>
      )}

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
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Quiz</h3>
            <span className="text-xs text-slate-500 capitalize">{q.type.replace("_", " ").toLowerCase()}</span>
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