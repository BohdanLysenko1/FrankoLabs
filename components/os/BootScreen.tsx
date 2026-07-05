"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LogoMark from "./LogoMark";

const BOOT_KEY = "franko-os-booted";
const BOOT_MS = 2100;

const bootLines = [
  "initializing modules…",
  "connecting CRM…",
  "mounting workspaces…",
  "starting services…",
];

export default function BootScreen() {
  const [booting, setBooting] = useState(true);
  const [line, setLine] = useState(0);

  useEffect(() => {
    // ?noboot=1 skips the boot sequence (handy for debugging/screenshots)
    if (
      sessionStorage.getItem(BOOT_KEY) ||
      new URLSearchParams(window.location.search).has("noboot")
    ) {
      setBooting(false);
      return;
    }
    const lineTimer = setInterval(
      () => setLine((l) => Math.min(l + 1, bootLines.length - 1)),
      BOOT_MS / bootLines.length,
    );
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem(BOOT_KEY, "1");
      setBooting(false);
    }, BOOT_MS);
    return () => {
      clearInterval(lineTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {booting && (
        <motion.div
          className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-desktop"
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          onClick={() => {
            sessionStorage.setItem(BOOT_KEY, "1");
            setBooting(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <LogoMark className="h-9 w-auto" />
            <span className="text-2xl font-semibold tracking-tight">
              Franko OS
            </span>
          </motion.div>
          <div className="h-1 w-56 overflow-hidden rounded-full bg-surface-3">
            <div
              className="boot-bar h-full rounded-full bg-accent"
              style={{ animationDuration: `${BOOT_MS / 1000 - 0.2}s` }}
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="font-mono text-xs text-ink-faint"
            >
              {bootLines[line]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
