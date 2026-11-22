"use client";

import { useEffect, useState } from "react";
import { highlightTerms } from "@/modules/stories/highlight";
import type { StoryDTO } from "@/shared/types";
import { LevelBadge, ModuleTag, speak } from "./ui";

/** Event handler: fetches the generated stories, or an empty list on failure. */
async function fetchStories(): Promise<StoryDTO[]> {
  const response = await fetch("/api/stories");
  if (!response.ok) throw new Error(`Stories failed with ${response.status}`);
  const data = (await response.json()) as StoryDTO[];
  return Array.isArray(data) ? data : [];
}

export function StoryMode() {
  const [stories, setStories] = useState<StoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    let active = true;
    fetchStories()
      .then((data) => {
        if (!active) return;
        setStories(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        console.error("Failed to load stories:", error);
        if (!active) return;
        // A failed fetch is the same honest empty state as an empty bank.
        setStories([]);
        setSelectedId(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectStory = (id: string) => {
    setSelectedId(id);
    setShowTranslation(false);
  };

  const story = stories.find((item) => item.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500">
        Cargando historias…
      </div>
    );
  }

  if (stories.length === 0 || !story) {
    return (
      <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-600">
        Todavía no hay historias generadas. Se generan desde{" "}
        <span className="font-semibold text-indigo-600">/studio</span> y aparecen acá.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] items-start">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-2 space-y-1">
        {stories.map((item) => {
          const active = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelectStory(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition ${
                active
                  ? "bg-indigo-50 border border-indigo-200"
                  : "border border-transparent hover:bg-slate-50"
              }`}
            >
              <span className={`block text-sm font-semibold ${active ? "text-indigo-700" : "text-slate-800"}`}>
                {item.title}
              </span>
              <span className="mt-1.5 flex items-center gap-2">
                <LevelBadge level={item.level} />
                <ModuleTag module={item.module} />
              </span>
            </button>
          );
        })}
      </div>

      <article className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-7 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge level={story.level} />
            <ModuleTag module={story.module} />
          </div>
          <button
            type="button"
            onClick={() => speak(story.body)}
            aria-label="Escuchar la historia completa"
            title="Escuchar la historia completa"
            className="h-9 w-9 shrink-0 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
          >
            <span aria-hidden="true">🔊</span>
          </button>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-900 break-words">{story.title}</h3>

        <p className="text-slate-700 leading-relaxed">
          {highlightTerms(story.body, story.targetWords).map((segment, index) =>
            segment.match ? (
              <mark
                key={index}
                className="bg-indigo-50 text-indigo-700 font-semibold underline decoration-indigo-300 decoration-2 underline-offset-2 px-0.5 rounded-sm"
              >
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>

        <div className="flex flex-wrap gap-2" aria-label="Palabras objetivo de la historia">
          {story.targetWords.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => speak(term)}
              aria-label={`Escuchar ${term}`}
              className="px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              🔊 {term}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <button
            type="button"
            onClick={() => setShowTranslation((value) => !value)}
            aria-pressed={showTranslation}
            className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            {showTranslation ? "Ocultar traducción" : "Ver traducción"}
          </button>
          <div aria-live="polite">
            {showTranslation ? (
              <p className="text-sm text-slate-600 border-l-2 border-indigo-200 pl-3 italic">{story.translation}</p>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}
