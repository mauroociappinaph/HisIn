"use client";

import { useState } from "react";
import type { VocabularyDTO, VocabularyKind } from "@/shared/types";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const MODULES = [
  { slug: "vocabulary", label: "Vocabulario" },
  { slug: "reading", label: "Reading" },
  { slug: "listening", label: "Listening" },
  { slug: "business-english", label: "Business English" },
  { slug: "contracts", label: "Contratos" },
  { slug: "grammar", label: "Gramática" },
] as const;

const FUNCTIONS = ["hedge", "soften", "persuade", "report", "compare", "express"] as const;
const REGISTERS = ["neutral", "informal", "formal"] as const;

interface EntryFormProps {
  /** Kinds this form may create; a single option hides the selector. */
  kinds: VocabularyKind[];
  defaultModule?: string;
  defaultLevel?: string;
  /** Opens straight into the form, for the floating quick-add button. */
  defaultOpen?: boolean;
  /** Lets the host close its own overlay when the form closes. */
  onClose?: () => void;
  onCreated: (entry: VocabularyDTO) => void;
}

const EMPTY = {
  kind: "" as VocabularyKind | "",
  term: "",
  definition: "",
  example: "",
  level: "B1",
  module: "business-english",
  particle: "",
  separable: false,
  register: "" as "" | (typeof REGISTERS)[number],
  patternFunction: "" as "" | (typeof FUNCTIONS)[number],
  notes: "",
};

/**
 * One form for the three shapes of entry.
 *
 * It asks for a gloss in the learner's own words and a sentence from their own
 * work instead of a dictionary copy, because that is the condition under which
 * self-written cards beat premade ones; and it collects the grammar metadata
 * (particle, separability, register, pattern function) that makes a saved entry
 * reviewable rather than just stored.
 */
export function EntryForm({ kinds, defaultModule, defaultLevel, defaultOpen = false, onClose, onCreated }: EntryFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState({
    ...EMPTY,
    kind: (kinds[0] ?? "WORD") as VocabularyKind,
    module: defaultModule ?? EMPTY.module,
    level: defaultLevel ?? EMPTY.level,
  });
  const [issues, setIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setIssues([]);
    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          term: form.term,
          definition: form.definition,
          example: form.example,
          kind: form.kind,
          level: form.level,
          module: form.module,
          ...(form.kind === "PHRASAL_VERB"
            ? {
                separable: form.separable,
                ...(form.register ? { register: form.register } : {}),
              }
            : {}),
          ...(form.kind === "PATTERN" && form.patternFunction ? { function: form.patternFunction } : {}),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as VocabularyDTO & {
        error?: string;
        issues?: string[];
      };
      if (!response.ok) {
        setIssues(body.issues ?? [body.error ?? "No pudimos guardar la entrada"]);
        return;
      }
      onCreated(body);
      setForm({ ...EMPTY, kind: form.kind, module: form.module, level: form.level });
      setOpen(false);
      onClose?.();
    } catch {
      setIssues(["No pudimos guardar la entrada"]);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
      >
        + Agregar {kinds.length === 1 ? label(kinds[0]) : "entrada"}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800">Agregar una entrada</h3>
          <p className="text-xs text-slate-500">
            Escribí la definición con tus palabras y una oración de tu trabajo: así la tarjeta funciona.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {kinds.length > 1 ? (
        <div className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Qué es</span>
          <div className="flex flex-wrap gap-2">
            {kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={form.kind === kind}
                onClick={() => update("kind", kind)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  form.kind === kind
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label(kind)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-600">
            {form.kind === "PATTERN"
              ? "Patrón (con slots)"
              : form.kind === "PHRASAL_VERB"
                ? "Phrasal verb"
                : form.kind === "IDIOM"
                  ? "Expresión"
                  : "Palabra"}
          </span>
          <input
            value={form.term}
            onChange={(event) => update("term", event.target.value)}
            placeholder={
              form.kind === "PATTERN"
                ? "make + object + verb"
                : form.kind === "PHRASAL_VERB"
                  ? "put off"
                  : form.kind === "IDIOM"
                    ? "cut corners"
                    : "runway"
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-600">Qué significa, con tus palabras</span>
          <textarea
            value={form.definition}
            onChange={(event) => update("definition", event.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-600">Una oración tuya, de tu trabajo</span>
          <textarea
            value={form.example}
            onChange={(event) => update("example", event.target.value)}
            rows={2}
            placeholder="We put off the board update until the audit closed."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Nivel</span>
          <select
            value={form.level}
            onChange={(event) => update("level", event.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Módulo</span>
          <select
            value={form.module}
            onChange={(event) => update("module", event.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
          >
            {MODULES.map((module) => (
              <option key={module.slug} value={module.slug}>
                {module.label}
              </option>
            ))}
          </select>
        </label>

        {form.kind === "PHRASAL_VERB" ? (
          <>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">¿Se separa?</span>
              <select
                value={form.separable ? "yes" : "no"}
                onChange={(event) => update("separable", event.target.value === "yes")}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="yes">Sí (turn it off)</option>
                <option value="no">No (look after it)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Registro</span>
              <select
                value={form.register}
                onChange={(event) => update("register", event.target.value as typeof form.register)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">Sin especificar</option>
                {REGISTERS.map((register) => (
                  <option key={register} value={register}>
                    {register}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {form.kind === "PATTERN" ? (
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-slate-600">Para qué sirve</span>
            <select
              value={form.patternFunction}
              onChange={(event) => update("patternFunction", event.target.value as typeof form.patternFunction)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              <option value="">Sin especificar</option>
              {FUNCTIONS.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-600">Dónde la encontraste (opcional)</span>
          <input
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Reunión con inversores, 14/03"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </label>
      </div>

      {issues.length > 0 ? (
        <ul className="space-y-1 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
          {issues.map((issue) => (
            <li key={issue}>• {issue}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {saving ? "Guardando…" : "Guardar y agregar al repaso"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onClose?.();
          }}
          className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function label(kind: VocabularyKind): string {
  if (kind === "PHRASAL_VERB") return "phrasal verb";
  if (kind === "PATTERN") return "patrón";
  if (kind === "IDIOM") return "expresión";
  return "palabra";
}
