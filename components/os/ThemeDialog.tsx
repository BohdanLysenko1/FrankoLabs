"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { playSound } from "@/lib/sound";
import { setTheme, useTheme, THEME_KEY, type Theme } from "@/lib/theme";

const OPEN_EVENT = "franko:theme-dialog";

/** Open the theme chooser from anywhere (menu bar, CRM topbar). */
export function openThemeDialog() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const options: { id: Theme; name: string; blurb: string }[] = [
  { id: "dark", name: "Dark", blurb: "The default — calm, focused, engineered." },
  { id: "light", name: "Light", blurb: "The same system in daylight." },
  { id: "xp", name: "Retro XP", blurb: "Olive Edition, straight out of 2003." },
];

function Preview({ id }: { id: Theme }) {
  if (id === "xp") {
    return (
      <div className="relative h-20 overflow-hidden rounded-md border border-edge">
        {/* Sky, hill, taskbar with start button, a beige window */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3d84c6] to-[#a5d2ee]" />
        <div className="absolute -bottom-5 -left-4 h-12 w-[130%] rounded-[100%] bg-gradient-to-b from-[#8fc45e] to-[#4d7f26]" />
        <div className="absolute right-2 top-2 h-9 w-16 rounded-[3px] border border-[#5d6b32] bg-[#ece9d8]">
          <div className="flex h-2.5 items-center justify-end gap-px rounded-t-[2px] bg-gradient-to-b from-[#b4c17c] to-[#6d7c3c] pr-0.5">
            <span className="size-1.5 rounded-[1px] bg-[#cf6548]" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex h-4 items-center gap-1 bg-gradient-to-b from-[#9db06a] to-[#5a6830] px-0.5">
          <span className="h-3 w-7 rounded-r-full bg-gradient-to-b from-[#8fbf57] to-[#528527]" />
          <span className="h-2.5 w-9 rounded-[2px] border border-[#55632c] bg-[#a9ba74]" />
        </div>
      </div>
    );
  }
  const dark = id === "dark";
  const surface = dark ? "bg-[#16161a]" : "bg-[#ececef]";
  const edge = dark ? "border-white/10" : "border-black/10";
  const accent = dark ? "bg-[#34d399]" : "bg-[#047857]";
  return (
    <div
      className={`relative h-20 overflow-hidden rounded-md border border-edge ${
        dark ? "bg-[#060608]" : "bg-[#dfe0e4]"
      }`}
    >
      <div className={`absolute right-2 top-2 h-9 w-16 rounded-md border ${edge} ${surface}`}>
        <div className={`flex h-2.5 items-center gap-0.5 border-b ${edge} px-1`}>
          <span className={`size-1 ${accent} hex`} />
          <span className={`size-1 opacity-40 ${accent} hex`} />
        </div>
      </div>
      <div
        className={`absolute bottom-1.5 left-1/2 flex h-4 w-20 -translate-x-1/2 items-center justify-center gap-1 rounded-md border ${edge} ${surface}`}
      >
        <span className={`size-1.5 rounded-full ${accent}`} />
        <span className={`size-1.5 rounded-full opacity-40 ${accent}`} />
        <span className={`size-1.5 rounded-full opacity-40 ${accent}`} />
      </div>
    </div>
  );
}

/**
 * Theme chooser dialog. Opens on the first visit (no saved theme yet) and
 * whenever the menu-bar/CRM theme button fires openThemeDialog().
 * The choice is saved to localStorage; dismissing saves nothing.
 */
export default function ThemeDialog() {
  const [open, setOpen] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const theme = useTheme();
  const retro = theme === "xp";

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem(THEME_KEY)) {
        // First visit — the boot screen (z-100) covers us until it fades.
        timer = setTimeout(() => {
          setFirstRun(true);
          setOpen(true);
        }, 300);
      }
    } catch {
      // Storage unavailable — never prompt, the toggle still works.
    }
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const choose = (t: Theme) => {
    setTheme(t);
    playSound("tap");
    setOpen(false);
    setFirstRun(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`w-full max-w-xl overflow-hidden border border-edge bg-surface-2 shadow-2xl shadow-black/60 backdrop-blur-xl ${
              retro ? "xp-window" : "rounded-xl"
            }`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Choose your theme"
          >
            {retro ? (
              <div className="xp-titlebar flex h-8 items-center gap-2 px-2">
                <span className="flex-1 truncate text-sm font-bold">
                  Display Properties
                </span>
                <button
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="xp-ctrl xp-ctrl-close"
                >
                  <X className="size-3.5" strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-edge px-5 py-3">
                <span className="text-[15px] font-semibold tracking-tight">
                  Appearance
                </span>
                <button
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-ink-dim transition hover:bg-surface-3 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="p-5">
              <p className="text-[15px] leading-relaxed text-ink-dim">
                {firstRun
                  ? "Welcome to Franko OS — pick how it should look. You can change this anytime from the menu bar."
                  : "Pick a theme. Saved on this device."}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {options.map((o) => {
                  const current = theme === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => choose(o.id)}
                      className={`group rounded-lg border p-2.5 text-left transition ${
                        current
                          ? "border-accent/60 bg-accent-dim"
                          : "border-edge bg-surface/90 hover:border-edge-strong hover:bg-surface-3"
                      }`}
                    >
                      <Preview id={o.id} />
                      <span className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold">
                        {o.name}
                        {current && <Check className="size-3.5 text-accent" strokeWidth={3} />}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-dim">
                        {o.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
