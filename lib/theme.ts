"use client";

import { useSyncExternalStore } from "react";

/**
 * Franko OS themes. "xp" is the retro Olive Edition — Windows XP-style
 * chrome (taskbar, beveled windows, Bliss-style wallpaper) in olive green.
 */
export type Theme = "dark" | "light" | "xp";

export const THEME_KEY = "franko-os-theme";

const themes: Theme[] = ["dark", "light", "xp"];

const listeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const cls = document.documentElement.classList;
  if (cls.contains("xp")) return "xp";
  if (cls.contains("light")) return "light";
  return "dark";
}

export function getTheme(): Theme {
  return readTheme();
}

export function setTheme(theme: Theme) {
  const cls = document.documentElement.classList;
  cls.toggle("light", theme === "light");
  cls.toggle("xp", theme === "xp");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage may be unavailable — theme still applies for this visit.
  }
  listeners.forEach((l) => l());
}

export function nextTheme(theme: Theme): Theme {
  return themes[(themes.indexOf(theme) + 1) % themes.length];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current theme, re-rendering on change. Serves "dark" during SSR. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);
}
