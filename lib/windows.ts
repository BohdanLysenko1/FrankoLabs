"use client";

import { useSyncExternalStore } from "react";

/**
 * Window workspace state — floating positions, snap layouts and the
 * minimized-to-dock list, persisted per window across visits.
 */

export type SnapZone = "left" | "right" | "tl" | "tr" | "bl" | "br";

export type WindowLayout = {
  x: number | null;
  y: number | null;
  w: number | null;
  h: number | null;
  snap: SnapZone | null;
  maximized: boolean;
};

export const defaultWindowLayout: WindowLayout = {
  x: null,
  y: null,
  w: null,
  h: null,
  snap: null,
  maximized: false,
};

export type MinimizedWindow = { title: string; href: string };

const LAYOUT_KEY = "franko-os-window-layout-v1";
const MINIMIZED_KEY = "franko-os-minimized-v1";
const CHANGE_EVENT = "franko-windows-change";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — layouts just don't persist.
  }
  notify();
}

function notify() {
  minimizedCache = null;
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeWindows(listener: () => void): () => void {
  const onStorage = () => {
    minimizedCache = null;
    listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function loadWindowLayout(key: string): WindowLayout {
  const map = read<Record<string, Partial<WindowLayout>>>(LAYOUT_KEY, {});
  const saved = map[key];
  return saved ? { ...defaultWindowLayout, ...saved } : defaultWindowLayout;
}

export function saveWindowLayout(key: string, layout: WindowLayout) {
  const map = read<Record<string, WindowLayout>>(LAYOUT_KEY, {});
  write(LAYOUT_KEY, { ...map, [key]: layout });
}

export function hasWindowLayout(key: string): boolean {
  return key in read<Record<string, WindowLayout>>(LAYOUT_KEY, {});
}

/** Clears every saved position, size and snap — plus the minimized list. */
export function resetWindowLayouts() {
  try {
    localStorage.removeItem(LAYOUT_KEY);
    localStorage.removeItem(MINIMIZED_KEY);
  } catch {
    // Nothing stored anyway.
  }
  notify();
}

let minimizedCache: MinimizedWindow[] | null = null;
const NO_MINIMIZED: MinimizedWindow[] = [];

function getMinimized(): MinimizedWindow[] {
  if (minimizedCache === null)
    minimizedCache = read<MinimizedWindow[]>(MINIMIZED_KEY, NO_MINIMIZED);
  return minimizedCache;
}

export function minimizeWindow(win: MinimizedWindow) {
  const next = [
    win,
    ...getMinimized().filter((m) => m.href !== win.href),
  ].slice(0, 8);
  write(MINIMIZED_KEY, next);
}

export function restoreWindow(href: string) {
  const current = getMinimized();
  if (!current.some((m) => m.href === href)) return;
  write(
    MINIMIZED_KEY,
    current.filter((m) => m.href !== href),
  );
}

/** Minimized windows shown in the dock, re-rendering on change. */
export function useMinimizedWindows(): MinimizedWindow[] {
  return useSyncExternalStore(subscribeWindows, getMinimized, () => NO_MINIMIZED);
}
