"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Asks the engine for the skills this topic is still missing.
 *
 * The call can take a while (one model round trip per batch), so the button
 * reports what is happening instead of freezing silently.
 */
export function GenerateMaterials({ slug, missing }: { slug: string; missing: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/topics/${slug}/generate`, { method: "POST" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "No pudimos generar el material.");
        return;
      }
      router.refresh();
    } catch {
      setError("No pudimos generar el material.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy}
        className="px-4 py-2 rounded-sm bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {busy ? "Gentleman Shell está escribiendo…" : `Generar ${missing.join(" · ")}`}
      </button>
      {busy ? (
        <p className="text-xs text-slate-500" aria-live="polite">
          Escribiendo grammar, reading, listening y writing para este tema, con contexto healthtech.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm px-3 py-2">{error}</p>
      ) : null}
    </div>
  );
}
