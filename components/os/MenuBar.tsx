"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command, Hexagon, Search, Volume2, VolumeX } from "lucide-react";
import { apps } from "@/lib/apps";
import { useDesktop } from "./DesktopContext";
import { playSound, setSoundsEnabled, soundsEnabled } from "@/lib/sound";

type MenuItem = { label: string; href: string };
type Menu = { label: string; items: MenuItem[] };

const menus: Menu[] = [
  {
    label: "File",
    items: [
      { label: "New Project Inquiry", href: "/contact" },
      { label: "Request Website Audit", href: "/contact?type=audit" },
      { label: "Join Franko OS Waitlist", href: "/contact?type=waitlist" },
    ],
  },
  {
    label: "Go",
    items: apps.map((a) => ({ label: a.name, href: a.href })),
  },
  {
    label: "Help",
    items: [
      { label: "Documentation", href: "/resources" },
      { label: "About Franko Labs", href: "/about" },
    ],
  },
];

function Clock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes(),
        ).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="whitespace-nowrap text-right font-mono text-sm tabular-nums text-ink-dim">
      {time}
    </span>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(soundsEnabled());
  }, []);

  return (
    <button
      aria-label={on ? "Mute UI sounds" : "Enable UI sounds"}
      title={on ? "UI sounds: on" : "UI sounds: off"}
      className={`rounded-md p-1.5 transition-colors hover:bg-surface-2 ${
        on ? "text-accent" : "text-ink-faint hover:text-ink-dim"
      }`}
      onClick={() => {
        const next = !on;
        setSoundsEnabled(next);
        setOn(next);
        if (next) playSound("tap");
      }}
    >
      {on ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}

export default function MenuBar() {
  const router = useRouter();
  const { openPalette } = useDesktop();
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <header
      ref={barRef}
      className="relative z-40 flex h-12 shrink-0 items-center gap-1 border-b border-edge bg-surface/80 px-4 backdrop-blur-md"
    >
      <div className="mr-3 flex items-center gap-2">
        <Hexagon className="size-5 text-accent" strokeWidth={2} />
        <span className="text-[15px] font-semibold tracking-tight">
          Franko OS
        </span>
      </div>

      <nav className="hidden items-center sm:flex">
        {menus.map((menu) => (
          <div key={menu.label} className="relative">
            <button
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                open === menu.label
                  ? "bg-surface-3 text-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
              onClick={() =>
                setOpen(open === menu.label ? null : menu.label)
              }
              onMouseEnter={() => open && setOpen(menu.label)}
            >
              {menu.label}
            </button>
            {open === menu.label && (
              <div className="absolute left-0 top-full mt-1 min-w-60 rounded-lg border border-edge bg-surface-2/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {menu.items.map((item) => (
                  <button
                    key={item.label}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink-dim transition-colors hover:bg-accent-dim hover:text-ink"
                    onClick={() => {
                      setOpen(null);
                      router.push(item.href);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <SoundToggle />
        <span className="hidden items-center gap-2 text-xs text-ink-dim md:flex">
          <span className="status-dot size-2 rounded-full bg-accent" />
          All systems online
        </span>
        <button
          className="flex items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-xs text-ink-dim transition-colors hover:border-edge-strong hover:text-ink"
          onClick={openPalette}
          aria-label="Open command palette"
        >
          <Search className="size-3.5" />
          Search
          <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-edge px-1 font-mono text-[10px] sm:flex">
            <Command className="size-2.5" />K
          </kbd>
        </button>
        <Clock />
      </div>
    </header>
  );
}
