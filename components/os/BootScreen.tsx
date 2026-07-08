"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LogoMark from "./LogoMark";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";

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
  const retro = useTheme() === "xp";

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
      playSound("startup");
    }, BOOT_MS);
    return () => {
      clearInterval(lineTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const skip = () => {
    sessionStorage.setItem(BOOT_KEY, "1");
    setBooting(false);
  };

  return (
    <AnimatePresence>
      {booting &&
        (retro ? (
          // Retro XP boot — black screen, logo, scrolling progress blocks
          <motion.div
            className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-10 bg-black text-white"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            onClick={skip}
          >
            <div className="flex flex-col items-center gap-3">
              <LogoMark className="h-16 w-auto" />
              <p className="text-3xl font-bold tracking-tight">
                Franko<span className="font-light"> OS</span>
              </p>
              <p className="text-sm font-semibold italic text-[#a3b268]">
                Olive Edition
              </p>
            </div>
            <div className="xp-boot-track">
              <div className="xp-boot-blocks">
                <span className="xp-boot-block" />
                <span className="xp-boot-block" />
                <span className="xp-boot-block" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-6 flex items-end justify-between px-8 text-xs text-neutral-400">
              <span>
                Copyright © Franko Labs
                <br />
                All rights reserved.
              </span>
              <span className="text-base font-semibold italic text-neutral-200">
                Professional
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-desktop"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            onClick={skip}
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
        ))}
    </AnimatePresence>
  );
}
