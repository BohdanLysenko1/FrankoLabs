"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppWindow, LayoutGrid, Volume2, X } from "lucide-react";
import LogoMark from "./LogoMark";
import StartMenu from "./StartMenu";
import { apps, type OSApp } from "@/lib/apps";
import { useCrm } from "@/lib/crm/store";
import { usePortalAuth } from "@/lib/portal/auth";
import { toolBadgesFor, toolsFor } from "@/lib/portal/portal";
import { useMinimizedWindows } from "@/lib/windows";
import { useClock } from "@/lib/clock";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Dock() {
  const pathname = usePathname();
  const { state } = useCrm();
  const { company } = usePortalAuth();
  const retro = useTheme() === "xp";
  const minimized = useMinimizedWindows();

  // Signed-in clients see their desktop's tools, not the marketing apps —
  // with badges counting what's waiting on them.
  const badges = company ? toolBadgesFor(state, company) : {};
  const items: OSApp[] = company
    ? [
        {
          id: "portal-dashboard",
          name: "Dashboard",
          href: "/",
          icon: LayoutGrid,
          description: "Your workspace at a glance",
        },
        ...toolsFor(state, company).map((t) => ({
          id: `portal-${t.id}`,
          name: t.name,
          href: t.href,
          icon: t.icon,
          description: t.description,
          badge: badges[t.id],
        })),
      ]
    : apps;

  if (retro) return <Taskbar items={items} pathname={pathname} />;

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-3">
      <nav className="pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-2xl border border-edge bg-surface/95 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {items.map((app, i) => {
          const active = isActive(pathname, app.href);
          const Icon = app.icon;
          return (
            <div key={app.id} className="flex items-end">
              {i === items.length - 1 && (
                <div className="mx-1.5 mb-4 h-10 w-px self-end bg-edge" />
              )}
              <Link
                href={app.href}
                target={app.newTab ? "_blank" : undefined}
                onClick={() => playSound("tap")}
                className="flex w-16 flex-col items-center sm:w-[4.5rem]"
              >
                <motion.span
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`relative flex size-12 items-center justify-center rounded-xl border sm:size-13 ${
                    active
                      ? "border-edge-strong bg-surface-3 text-accent"
                      : "border-transparent text-ink-dim hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon className="size-6 sm:size-7" strokeWidth={1.75} />
                  {app.badge !== undefined && app.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-semibold tabular-nums text-black shadow">
                      {app.badge > 9 ? "9+" : app.badge}
                    </span>
                  )}
                </motion.span>
                <span
                  className={`mt-1 text-[11px] font-medium sm:text-xs ${
                    active ? "text-ink" : "text-ink-dim"
                  }`}
                >
                  {app.name}
                </span>
                <span
                  className={`mt-0.5 size-1 rounded-full ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
              </Link>
            </div>
          );
        })}
        {minimized.length > 0 && (
          <div className="mx-1.5 mb-4 h-10 w-px self-end bg-edge" />
        )}
        {minimized.map((win) => {
          const Icon =
            apps.find((a) => a.href !== "/" && win.href.startsWith(a.href))
              ?.icon ?? AppWindow;
          return (
            <Link
              key={win.href}
              href={win.href}
              title={`Restore ${win.title}`}
              onClick={() => playSound("tap")}
              className="flex w-16 flex-col items-center sm:w-[4.5rem]"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.12, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex size-12 items-center justify-center rounded-xl border border-dashed border-edge-strong bg-surface-2/60 text-ink-dim hover:text-ink sm:size-13"
              >
                <Icon className="size-6 sm:size-7" strokeWidth={1.75} />
              </motion.span>
              <span className="mt-1 max-w-full truncate text-[11px] font-medium text-ink-dim sm:text-xs">
                {win.title}
              </span>
              <span className="mt-0.5 size-1 rounded-full bg-ink-faint" />
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Retro XP taskbar: Start button, window buttons, system tray.        */
/* ------------------------------------------------------------------ */

function TrayClock() {
  const time = useClock();
  return <span className="text-xs tabular-nums">{time}</span>;
}

const BALLOON_KEY = "franko-xp-balloon";

/** One-time "welcome" notification balloon rising from the tray. */
function WelcomeBalloon() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(BALLOON_KEY)) return;
    const showTimer = setTimeout(() => {
      sessionStorage.setItem(BALLOON_KEY, "1");
      setShow(true);
      playSound("balloon");
    }, 1600);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!show) return;
    const hide = setTimeout(() => setShow(false), 9000);
    return () => clearTimeout(hide);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="xp-balloon absolute bottom-12 right-2 z-50 w-72 p-3 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold">
              Welcome to Franko OS — Olive Edition
            </p>
            <button
              aria-label="Dismiss"
              onClick={() => setShow(false)}
              className="rounded-sm border border-transparent p-0.5 hover:border-[#5a5a3c]"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed">
            You&apos;ve traveled back to 2003. Everything still works — try the
            start menu, or press ⌘K to search. Turn off retro mode from the
            start menu anytime.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Taskbar({ items, pathname }: { items: OSApp[]; pathname: string }) {
  const [startOpen, setStartOpen] = useState(false);

  return (
    <footer className="xp-taskbar relative z-40 flex h-10 shrink-0 select-none items-stretch">
      {startOpen && <StartMenu onClose={() => setStartOpen(false)} />}
      <button
        onClick={() => {
          playSound("tap");
          setStartOpen((o) => !o);
        }}
        className="xp-start flex items-center gap-1.5 pl-2 pr-5 text-lg"
        aria-expanded={startOpen}
      >
        <LogoMark className="h-5 w-auto drop-shadow" />
        start
      </button>

      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1.5 py-1">
        {items.map((app) => {
          const active = isActive(pathname, app.href);
          const Icon = app.icon;
          return (
            <Link
              key={app.id}
              href={app.href}
              target={app.newTab ? "_blank" : undefined}
              onClick={() => playSound("tap")}
              className={`xp-task-btn flex h-full min-w-0 shrink-0 items-center gap-1.5 px-2.5 text-xs font-semibold sm:min-w-28 ${
                active ? "xp-task-btn-active" : ""
              }`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              <span className="hidden truncate sm:inline">{app.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="xp-tray relative flex items-center gap-2 px-3">
        <WelcomeBalloon />
        <Volume2 className="size-3.5" />
        <TrayClock />
      </div>
    </footer>
  );
}
