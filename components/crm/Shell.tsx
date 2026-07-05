"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  CalendarDays,
  ChartColumn,
  Command,
  Eye,
  Kanban,
  LayoutDashboard,
  ListChecks,
  LogOut,
  RotateCcw,
  Search,
  Settings,
  Users,
} from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
import { computePulse, overallPulse, healthStyle } from "@/lib/crm/pulse";
import { Avatar } from "./ui";
import Onboarding from "./Onboarding";
import CrmCommand from "./CrmCommand";
import NotificationsBell from "./NotificationsBell";

const nav = [
  { label: "Dashboard", href: "/crm", icon: LayoutDashboard },
  { label: "Pulse", href: "/crm/pulse", icon: Activity },
  { label: "Pipeline", href: "/crm/pipeline", icon: Kanban },
  { label: "Calendar", href: "/crm/calendar", icon: CalendarDays },
  { label: "Contacts", href: "/crm/contacts", icon: Users },
  { label: "Companies", href: "/crm/companies", icon: Building2 },
  { label: "Tasks", href: "/crm/tasks", icon: ListChecks },
  { label: "Reports", href: "/crm/reports", icon: ChartColumn },
];

const mobileNav = nav.filter((i) =>
  ["Dashboard", "Pulse", "Pipeline", "Calendar", "Tasks"].includes(i.label),
);

function isActive(pathname: string, href: string) {
  return href === "/crm" ? pathname === "/crm" : pathname.startsWith(href);
}

function PulseChip() {
  const { state } = useCrm();
  const score = useMemo(
    () => overallPulse(computePulse(state).health),
    [state],
  );
  const status = score >= 72 ? "healthy" : score >= 45 ? "cooling" : "at-risk";
  const style = healthStyle[status];
  return (
    <Link
      href="/crm/pulse"
      title="Pipeline pulse — average deal health"
      className="flex items-center gap-2 rounded-full border border-edge bg-surface-2/60 px-3 py-1.5 text-xs font-medium transition hover:border-edge-strong"
    >
      <span className={`status-dot size-2 rounded-full ${style.dot}`} />
      <span className="text-ink-dim">Pulse</span>
      <span className={`font-mono tabular-nums ${style.text}`}>{score}</span>
    </Link>
  );
}

function UserMenu() {
  const { state, actions } = useCrm();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const owner = state.team[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  if (!owner) return null;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        className="rounded-full transition hover:brightness-110"
      >
        <Avatar name={owner.name} hue={owner.hue} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-edge bg-surface-2/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="border-b border-edge px-3 py-2.5">
            <p className="truncate text-sm font-medium">{owner.name}</p>
            <p className="truncate text-xs text-ink-faint">{owner.email}</p>
          </div>
          <Link
            href="/crm/settings"
            onClick={() => setOpen(false)}
            className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-ink-dim transition hover:bg-accent-dim hover:text-ink"
          >
            <Settings className="size-4" />
            Workspace settings
          </Link>
          <button
            onClick={() => {
              actions.resetDemo();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-ink-dim transition hover:bg-accent-dim hover:text-ink"
          >
            <RotateCcw className="size-4" />
            Reset demo data
          </button>
          <Link
            href="/"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-ink-dim transition hover:bg-accent-dim hover:text-ink"
          >
            <LogOut className="size-4" />
            Back to frankolabs.com
          </Link>
        </div>
      )}
    </div>
  );
}

const subscribeNoop = () => () => {};

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useCrm();

  // The store seeds itself with Date.now()-relative data, so the server and
  // client trees can disagree — render the app only after hydration.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-desktop">
        <div className="flex items-center gap-3 opacity-60">
          <LogoMark className="h-7 w-auto" />
          <span className="text-lg font-semibold tracking-tight">
            Franko CRM
          </span>
        </div>
      </div>
    );
  }

  if (!state.onboarded) return <Onboarding />;

  const inPortal = pathname.startsWith("/crm/portal");

  return (
    <div className="flex h-dvh bg-desktop">
      {!inPortal && (
        <aside className="hidden w-60 shrink-0 flex-col border-r border-edge bg-surface/60 md:flex">
          <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
            <LogoMark className="h-6 w-auto" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight tracking-tight">
                Franko CRM
              </p>
              <p className="truncate text-xs text-ink-faint">
                {state.workspace.name}
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 px-3">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-accent-dim font-medium text-ink"
                      : "text-ink-dim hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon
                    className={`size-4.5 ${active ? "text-accent" : ""}`}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-0.5 border-t border-edge p-3">
            <Link
              href="/crm/portal"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-dim transition hover:bg-surface-2 hover:text-ink"
            >
              <Eye className="size-4.5" strokeWidth={1.75} />
              View as client
            </Link>
            <Link
              href="/crm/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive(pathname, "/crm/settings")
                  ? "bg-accent-dim font-medium text-ink"
                  : "text-ink-dim hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Settings
                className={`size-4.5 ${isActive(pathname, "/crm/settings") ? "text-accent" : ""}`}
                strokeWidth={1.75}
              />
              Settings
            </Link>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {!inPortal && (
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-edge bg-surface/60 px-4 md:px-6">
            <div className="flex items-center gap-2.5 md:hidden">
              <LogoMark className="h-5 w-auto" />
              <span className="text-sm font-semibold tracking-tight">
                Franko CRM
              </span>
            </div>
            <nav className="os-scroll -mx-1 hidden items-center gap-0.5 overflow-x-auto px-1 md:flex lg:hidden">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-1 text-xs text-ink-dim hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", metaKey: true }),
                  )
                }
                className="hidden items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-2.5 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink lg:flex"
                aria-label="Open command palette"
              >
                <Search className="size-3.5" />
                Search
                <kbd className="ml-1 flex items-center gap-0.5 rounded border border-edge px-1 font-mono text-[10px]">
                  <Command className="size-2.5" />K
                </kbd>
              </button>
              <PulseChip />
              <NotificationsBell />
              <UserMenu />
            </div>
          </header>
        )}
        <main className="os-scroll min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
        {/* Mobile bottom nav */}
        {!inPortal && (
          <nav className="flex shrink-0 items-center justify-around border-t border-edge bg-surface/80 px-2 py-1.5 backdrop-blur-md md:hidden">
            {mobileNav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[10px] ${
                    active ? "text-accent" : "text-ink-faint"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
      <CrmCommand />
    </div>
  );
}
