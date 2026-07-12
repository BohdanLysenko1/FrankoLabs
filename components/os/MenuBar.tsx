"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  LogIn,
  LogOut,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import LogoMark from "./LogoMark";
import { apps } from "@/lib/apps";
import { useDesktop } from "./DesktopContext";
import { usePortalAuth } from "@/lib/portal/auth";
import { toolsFor } from "@/lib/portal/portal";
import { useCrm } from "@/lib/crm/store";
import PortalBell from "@/components/portal/PortalBell";
import type { Company, CrmState } from "@/lib/crm/types";
import { useClock } from "@/lib/clock";
import { playSound, setSoundsEnabled, soundsEnabled } from "@/lib/sound";
import ThemeToggle from "./ThemeToggle";

type MenuItem = { label: string; href: string; newTab?: boolean };
type Menu = { label: string; items: MenuItem[] };

const publicMenus: Menu[] = [
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
    items: apps.map((a) => ({
      label: a.name,
      href: a.href,
      newTab: a.newTab,
    })),
  },
  {
    label: "Help",
    items: [
      { label: "Documentation", href: "/resources" },
      { label: "About Franko Labs", href: "/about" },
    ],
  },
];

/** Signed-in clients get their tools in Go and client actions in File. */
function clientMenus(state: CrmState, company: Company): Menu[] {
  const tools = toolsFor(state, company);
  return [
    {
      label: "File",
      items: [
        ...(tools.some((t) => t.id === "support")
          ? [{ label: "New Support Request", href: "/portal/support" }]
          : []),
        { label: "Book a Call", href: "/contact" },
      ],
    },
    {
      label: "Go",
      items: [
        { label: "Dashboard", href: "/" },
        ...tools.map((t) => ({ label: t.name, href: t.href })),
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Documentation", href: "/resources" },
        { label: "About Franko Labs", href: "/about" },
      ],
    },
  ];
}

function Clock() {
  const time = useClock();
  return (
    <span className="whitespace-nowrap text-right font-mono text-sm tabular-nums text-ink-dim">
      {time}
    </span>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const soundTimer = window.setTimeout(() => setOn(soundsEnabled()), 0);
    return () => clearTimeout(soundTimer);
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
  const { state } = useCrm();
  const { ready, company, signOut } = usePortalAuth();
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  const menus = company ? clientMenus(state, company) : publicMenus;

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
      className="os-menubar relative z-40 flex h-12 shrink-0 items-center gap-1 border-b border-edge bg-surface/95 px-4 backdrop-blur-md"
    >
      <div className="mr-3 flex items-center gap-2">
        <LogoMark className="h-5 w-auto" />
        <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight">
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
              <div className="os-menu absolute left-0 top-full mt-1 min-w-60 rounded-lg border border-edge bg-surface-2 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {menu.items.map((item) => (
                  <button
                    key={item.label}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink-dim transition-colors hover:bg-accent-dim hover:text-ink"
                    onClick={() => {
                      setOpen(null);
                      if (item.newTab) {
                        window.open(item.href, "_blank", "noopener");
                      } else {
                        router.push(item.href);
                      }
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
        <ThemeToggle />
        <SoundToggle />
        {company && <PortalBell key={company.id} company={company} />}
        {company ? (
          <span className="hidden items-center gap-2 md:flex">
            <span className="flex items-center gap-2 rounded-full border border-edge bg-surface-2 py-1 pl-2.5 pr-1.5 text-xs text-ink-dim">
              <span className="status-dot size-2 rounded-full bg-accent" />
              {company.name}
              <button
                aria-label="Sign out"
                title="Sign out"
                onClick={signOut}
                className="rounded-full p-1 text-ink-dim transition-colors hover:bg-surface-3 hover:text-ink"
              >
                <LogOut className="size-3.5" />
              </button>
            </span>
          </span>
        ) : (
          <>
            <span className="hidden items-center gap-2 text-xs text-ink-dim md:flex">
              <span className="status-dot size-2 rounded-full bg-accent" />
              All systems online
            </span>
            {ready && (
              <button
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-xs text-ink-dim transition-colors hover:border-edge-strong hover:text-ink"
                onClick={() => router.push("/login")}
              >
                <LogIn className="size-3.5" />
                Sign in
              </button>
            )}
          </>
        )}
        <button
          className="flex items-center gap-1.5 rounded-md border border-edge bg-surface-2 px-2.5 py-1.5 text-xs text-ink-dim transition-colors hover:border-edge-strong hover:text-ink"
          onClick={openPalette}
          aria-label="Open command palette"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden items-center gap-0.5 rounded border border-edge px-1 font-mono text-[10px] sm:flex">
            <Command className="size-2.5" />K
          </kbd>
        </button>
        <Clock />
      </div>
    </header>
  );
}
