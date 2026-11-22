"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VocabularyDTO } from "@/shared/types";
import { buildRound, createRng, scoreAnswer } from "@/modules/vocabulary/quiz";
import type { ScoreState } from "@/modules/vocabulary/quiz";
import { LevelBadge, ProgressBar } from "./ui";

const ROUND_SIZE = 10;
const FEEDBACK_DELAY_MS = 950;

interface ChallengeModeProps {
  bank: VocabularyDTO[];
  loading: boolean;
  /** Items per round: the class duration decides how long a session is. */
  roundSize?: number;
  score: ScoreState;
  /** XP gained and whether it was right; the tally itself belongs to the server. */
  onAnswered: (gained: number, correct: boolean) => void;
  onToast: (message: string, tone?: "success" | "info" | "warning") => void;
}

export function ChallengeMode({ bank, loading, roundSize = ROUND_SIZE, score, onAnswered, onToast }: ChallengeModeProps) {
  const [roundKey, setRoundKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [round, setRound] = useState({ answered: 0, correct: 0, xp: 0 });
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = useMemo(
    () => buildRound(bank, { count: roundSize, rng: createRng(roundKey + 1) }),
    [bank, roundKey, roundSize],
  );
  const question = questions[index];

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const advance = useCallback(() => {
    clearTimer();
    setChosen(null);
    setIndex((value) => {
      if (value + 1 >= questions.length) {
        setFinished(true);
        return value;
      }
      return value + 1;
    });
  }, [clearTimer, questions.length]);

  const choose = useCallback(
    (term: string) => {
      if (!question || chosen !== null) return;
      const correct = term === question.answer;
      const result = scoreAnswer(score, correct);
      onAnswered(result.gained, correct);
      setChosen(term);
      setRound((previous) => ({
        answered: previous.answered + 1,
        correct: previous.correct + (correct ? 1 : 0),
        xp: previous.xp + result.gained,
      }));
      if (correct) {
        onToast(`+${result.gained} XP${result.state.streak > 1 ? ` · racha ${result.state.streak} 🔥` : ""}`, "success");
      } else {
        onToast(`Era “${question.answer}”`, "warning");
      }
      timer.current = setTimeout(advance, FEEDBACK_DELAY_MS);
    },
    [advance, chosen, onAnswered, onToast, question, score],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!question || chosen !== null) return;
      const position = Number(event.key);
      if (position >= 1 && position <= question.options.length) {
        event.preventDefault();
        choose(question.options[position - 1].term);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [choose, chosen, question]);

  function restart() {
    clearTimer();
    setRoundKey((value) => value + 1);
    setIndex(0);
    setChosen(null);
    setRound({ answered: 0, correct: 0, xp: 0 });
    setFinished(false);
  }

  if (loading) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
        Preparando el desafío…
      </div>
    );
  }

  if (questions.length === 0 || !question) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-600">
        No hay vocabulario cargado para armar un desafío.
      </div>
    );
  }

  if (finished) {
    const accuracy = round.answered === 0 ? 0 : Math.round((round.correct / round.answered) * 100);
    return (
      <div className="space-y-4">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-center space-y-2">
          <div className="text-4xl" aria-hidden="true">
            🏁
          </div>
          <h3 className="text-2xl font-bold">Ronda terminada</h3>
          <p className="text-white/85 text-sm">
            {round.correct} de {round.answered} correctas ({accuracy}%) · +{round.xp} XP en esta ronda
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-xs uppercase tracking-wide text-slate-500">XP total</div>
            <div className="text-2xl font-bold text-indigo-600">{score.xp}</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-xs uppercase tracking-wide text-slate-500">Racha actual</div>
            <div className="text-2xl font-bold text-amber-500">{score.streak}</div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <div className="text-xs uppercase tracking-wide text-slate-500">Mejor racha</div>
            <div className="text-2xl font-bold text-slate-800">{score.best}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={restart}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Otra ronda
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Pregunta {index + 1} de {questions.length}
        </span>
        <span className="flex items-center gap-3">
          <span className="font-semibold text-indigo-600">{score.xp} XP</span>
          <span className={score.streak > 0 ? "font-semibold text-amber-500" : ""}>🔥 {score.streak}</span>
        </span>
      </div>
      <ProgressBar value={(index / questions.length) * 100} tone="amber" />

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-7 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {question.kind === "cloze" ? "Completá la oración" : "¿Qué palabra corresponde?"}
          </span>
          <LevelBadge level={bank.find((item) => item.id === question.vocabularyId)?.level ?? "B1"} />
        </div>

        <p className="text-xl font-medium text-slate-900 leading-relaxed">{question.prompt}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option, position) => {
            const isAnswer = option.term === question.answer;
            const isChosen = chosen === option.term;
            const settled = chosen !== null;
            const tone = !settled
              ? "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60"
              : isAnswer
                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                : isChosen
                  ? "border-rose-400 bg-rose-50 text-rose-700"
                  : "border-slate-200 opacity-60";
            return (
              <button
                key={option.id + option.term}
                type="button"
                disabled={settled}
                onClick={() => choose(option.term)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left font-medium transition ${tone}`}
              >
                <span className="h-6 w-6 shrink-0 rounded-md bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                  {position + 1}
                </span>
                <span className="break-words">{option.term}</span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="min-h-6 text-sm">
          {chosen !== null ? (
            <p className={chosen === question.answer ? "text-emerald-700" : "text-rose-700"}>
              {chosen === question.answer ? "¡Correcto! " : "Casi. "}
              <span className="text-slate-600 italic">{question.context}</span>
            </p>
          ) : (
            <p className="text-slate-500">Elegí una opción, o usá las teclas 1–4.</p>
          )}
        </div>

        {chosen !== null ? (
          <button
            type="button"
            onClick={advance}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Siguiente →
          </button>
        ) : null}
      </div>
    </div>
  );
}
