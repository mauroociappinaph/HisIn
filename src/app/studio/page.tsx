"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Kind = "question" | "vocabulary" | "lesson" | "story";
type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

interface JobSummary {
  id: string;
  kind: string;
  status: JobStatus;
  model: string;
  createdCount: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

interface JobDetail extends JobSummary {
  output: unknown[] | null;
}

interface GeneratedQuestion {
  prompt: string;
  options: string[];
  answer: string;
  explanation?: string;
  tags?: string[];
}

interface GeneratedVocabulary {
  term: string;
  definition: string;
  example: string;
}

interface GeneratedLesson {
  title: string;
  summary: string;
  content: string;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const SKILLS = ["VOCABULARY", "GRAMMAR", "READING", "LISTENING", "BUSINESS", "CONTRACTS"];
const TYPES = ["MULTIPLE_CHOICE", "FILL_BLANK", "TRUE_FALSE", "LISTENING_MCQ"];

const STATUS_STYLE: Record<JobStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700",
  RUNNING: "bg-amber-100 text-amber-800",
  SUCCEEDED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

function isTerminal(status: JobStatus): boolean {
  return status === "SUCCEEDED" || status === "FAILED";
}

export default function StudioPage() {
  const [kind, setKind] = useState<Kind>("question");
  const [level, setLevel] = useState("B1");
  const [skill, setSkill] = useState("BUSINESS");
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [count, setCount] = useState(3);
  const [topic, setTopic] = useState("");

  const [job, setJob] = useState<JobDetail | null>(null);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/jobs?limit=20");
      if (!response.ok) return;
      setJobs((await response.json()) as JobSummary[]);
    } catch {
      // The list is informative; a failure here must not break generation.
    }
  }, []);

  const loadJob = useCallback(async (id: string) => {
    const response = await fetch(`/api/ai/jobs/${id}`);
    if (!response.ok) return null;
    const detail = (await response.json()) as JobDetail;
    setJob(detail);
    if (isTerminal(detail.status)) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      void loadJobs();
    }
    return detail;
  }, [loadJobs]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      await loadJobs();
    })();
    return () => {
      active = false;
    };
  }, [loadJobs]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function attachToJob(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void loadJob(id);
    }, 2000);
    void loadJob(id);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = { kind, level, count };
    if (kind === "question") {
      payload.skill = skill;
      payload.type = type;
    }
    if (topic.trim().length >= 3) payload.topic = topic.trim();

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));

      if (response.status === 202) {
        setNotice("Generación aceptada. Gentle Shell está trabajando.");
        attachToJob(body.jobId);
      } else if (response.status === 429) {
        setNotice(`Ya hay una generación corriendo (${body.jobId}). Me engancho a esa.`);
        attachToJob(body.jobId);
      } else if (response.status === 401) {
        setError(
          "El servidor no autoriza generación. Arrancalo con AI_ALLOW_LOCAL=1 o enviá el token de servicio.",
        );
      } else if (response.status === 400) {
        const issues = Array.isArray(body.issues)
          ? body.issues.map((issue: { message?: string }) => issue.message).join("; ")
          : "";
        setError(`Pedido inválido. ${issues}`.trim());
      } else {
        setError(body.error ?? `Error ${response.status}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falló la request");
    } finally {
      setSubmitting(false);
    }
  }

  const items = job?.output ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Generar contenido</h2>
        <p className="text-sm text-slate-600">
          Gentle Shell genera ejercicios, vocabulario y lecciones, y solo se guarda lo que pasa la
          validación. Es una herramienta de operador: necesita <code className="text-xs">AI_ALLOW_LOCAL=1</code>{" "}
          en el servidor o el token de servicio.
        </p>
      </div>

      <form onSubmit={submit} className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Qué generar</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as Kind)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="question">Ejercicios</option>
              <option value="vocabulary">Vocabulario</option>
              <option value="lesson">Lecciones</option>
              <option value="story">Historias</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Nivel</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {LEVELS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Cantidad</span>
            <input
              type="number"
              min={1}
              max={5}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full px-3 py-2 border rounded"
            />
          </label>
        </div>

        {kind === "question" && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Skill</span>
              <select
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                {SKILLS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Tipo</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                {TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label className="space-y-1 text-sm block">
          <span className="font-medium">Tema (opcional)</span>
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="investor updates, HIPAA compliance, term sheets…"
            className="w-full px-3 py-2 border rounded"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Generar"}
        </button>

        {notice && <p className="text-sm text-amber-700">{notice}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </form>

      {job && (
        <div className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Job {job.id}</span>
            <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLE[job.status]}`}>{job.status}</span>
            <span className="text-xs text-slate-500">{job.model}</span>
            {job.status === "SUCCEEDED" && (
              <span className="text-xs text-slate-500">{job.createdCount} creados</span>
            )}
          </div>

          {job.error && <p className="text-sm text-red-700 break-words">{job.error}</p>}

          {job.status === "PENDING" || job.status === "RUNNING" ? (
            <p className="text-sm text-slate-600">
              Trabajando… puede tardar entre 5 y 60 segundos según el proveedor.
            </p>
          ) : null}

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border text-sm space-y-2">
                  {job.kind === "question" ? (
                    <>
                      <p className="font-medium">{(item as GeneratedQuestion).prompt}</p>
                      <ul className="list-disc pl-5 text-slate-700">
                        {(item as GeneratedQuestion).options.map((option) => (
                          <li key={option}>{option}</li>
                        ))}
                      </ul>
                      <p className="text-green-700">Respuesta: {(item as GeneratedQuestion).answer}</p>
                      {(item as GeneratedQuestion).explanation && (
                        <p className="text-slate-600">{(item as GeneratedQuestion).explanation}</p>
                      )}
                    </>
                  ) : job.kind === "vocabulary" ? (
                    <>
                      <p className="font-medium">{(item as GeneratedVocabulary).term}</p>
                      <p className="text-slate-700">{(item as GeneratedVocabulary).definition}</p>
                      <p className="text-slate-500 italic">{(item as GeneratedVocabulary).example}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{(item as GeneratedLesson).title}</p>
                      <p className="text-slate-700">{(item as GeneratedLesson).summary}</p>
                      <p className="text-slate-600 whitespace-pre-wrap">
                        {(item as GeneratedLesson).content}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Jobs recientes</h3>
          <button onClick={() => void loadJobs()} className="text-sm text-indigo-600 hover:underline">
            Actualizar
          </button>
        </div>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay generaciones.</p>
        ) : (
          <ul className="divide-y text-sm">
            {jobs.map((entry) => (
              <li key={entry.id} className="py-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => attachToJob(entry.id)}
                  className="font-mono text-xs text-indigo-600 hover:underline"
                >
                  {entry.id.slice(0, 10)}
                </button>
                <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLE[entry.status]}`}>
                  {entry.status}
                </span>
                <span className="text-slate-600">{entry.kind}</span>
                <span className="text-slate-500">{entry.createdCount} creados</span>
                <span className="text-slate-400 text-xs ml-auto">
                  {new Date(entry.createdAt).toLocaleString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
