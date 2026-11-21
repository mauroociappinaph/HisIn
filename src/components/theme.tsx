"use client";

import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Palette = "teal" | "rosa" | "celeste" | "violeta" | "azul-fuerte";

const THEME_KEY = "hisin:theme";
const PALETTE_KEY = "hisin:palette";
const CONTRAST_KEY = "hisin:contrast";

/**
 * Applies the stored theme before first paint.
 *
 * Without this the page renders light and then flips, which reads as a bug. The
 * colours themselves are HisMia's tokens (see globals.css).
 */
export const themeScript = `
(function () {
  try {
    var theme = localStorage.getItem("${THEME_KEY}") || "system";
    var palette = localStorage.getItem("${PALETTE_KEY}") || "teal";
    var contrast = localStorage.getItem("${CONTRAST_KEY}") || "normal";
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    if (palette !== "teal") root.setAttribute("data-palette", palette);
    if (contrast === "high") root.setAttribute("data-contrast", "high");
  } catch (error) {}
})();
`;

function apply(theme: ThemeMode, palette: Palette, contrast: "normal" | "high") {
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  if (palette === "teal") root.removeAttribute("data-palette");
  else root.setAttribute("data-palette", palette);
  if (contrast === "high") root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
}

const CHANGE_EVENT = "hisin:appearance";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/**
 * localStorage is the source of truth for appearance, read through an external
 * store so the controls never set state inside an effect and never disagree with
 * the inline script that paints the page.
 */
function getSnapshot(): string {
  try {
    return [
      localStorage.getItem(THEME_KEY) ?? "system",
      localStorage.getItem(PALETTE_KEY) ?? "teal",
      localStorage.getItem(CONTRAST_KEY) ?? "normal",
    ].join("|");
  } catch {
    return "system|teal|normal";
  }
}

function getServerSnapshot(): string {
  return "system|teal|normal";
}

export function ThemeControls() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, palette, contrast] = snapshot.split("|") as [ThemeMode, Palette, "normal" | "high"];

  function change(next: { theme?: ThemeMode; palette?: Palette; contrast?: "normal" | "high" }) {
    const resolvedTheme = next.theme ?? theme;
    const resolvedPalette = next.palette ?? palette;
    const resolvedContrast = next.contrast ?? contrast;
    try {
      localStorage.setItem(THEME_KEY, resolvedTheme);
      localStorage.setItem(PALETTE_KEY, resolvedPalette);
      localStorage.setItem(CONTRAST_KEY, resolvedContrast);
    } catch {
      // Private mode can reject writes; the applied classes still change.
    }
    apply(resolvedTheme, resolvedPalette, resolvedContrast);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-600">Tema</span>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={theme === mode}
              onClick={() => change({ theme: mode })}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                theme === mode ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mode === "light" ? "Claro" : mode === "dark" ? "Oscuro" : "Sistema"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-600">Paleta</span>
        <div className="flex flex-wrap gap-2">
          {(["teal", "rosa", "celeste", "violeta", "azul-fuerte"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={palette === option}
              onClick={() => change({ palette: option })}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition ${
                palette === option ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={contrast === "high"}
          onChange={(event) => change({ contrast: event.target.checked ? "high" : "normal" })}
          className="accent-indigo-600"
        />
        Alto contraste
      </label>
    </div>
  );
}
