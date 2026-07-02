"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  Users,
  Workflow,
  Sparkles,
  BarChart3,
  Server,
  ArrowRight,
  Command,
  ChevronDown,
  CalendarCheck,
  FileSearch,
  FolderOpen,
  Search,
} from "lucide-react";
import Widget from "@/components/os/Widget";
import { useDesktop } from "@/components/os/DesktopContext";

const modules = [
  { icon: Globe, name: "Websites", status: "online" },
  { icon: Users, name: "CRM", status: "online" },
  { icon: Workflow, name: "Automation", status: "online" },
  { icon: Sparkles, name: "AI", status: "beta" },
  { icon: BarChart3, name: "Analytics", status: "online" },
  { icon: Server, name: "Hosting", status: "online" },
];

const activity = [
  "Client site pushed to production",
  "3 new leads captured overnight",
  "Follow-up emails drafted for review",
  "All 14 monitored sites healthy",
  "Weekly ranking report generated",
];

export default function Dashboard() {
  const { openPalette } = useDesktop();
  const dashboardRef = useRef<HTMLElement>(null);

  const quickActions = [
    { icon: CalendarCheck, label: "Book a call", href: "/contact" },
    { icon: FileSearch, label: "Free website audit", href: "/contact?type=audit" },
    { icon: FolderOpen, label: "See our work", href: "/projects" },
  ];

  return (
    <div className="os-scroll h-full overflow-y-auto md:snap-y md:snap-mandatory">
      {/* Screen 1 — hero */}
      <section className="relative flex min-h-full flex-col items-center justify-center px-4 md:snap-start">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl pb-24 text-center"
        >
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-surface/60 px-4 py-1.5 text-xs font-medium tracking-wide text-ink-dim backdrop-blur">
            <span className="status-dot size-2 rounded-full bg-accent" />
            Franko OS — system online
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Everything your business needs.
            <br />
            <span className="text-accent">One connected system.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-ink-dim md:text-lg">
            Franko Labs builds complete business systems — websites, CRM,
            automation, AI, analytics and hosting — running as one operating
            system, not a pile of disconnected tools.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
            >
              Book a free consultation
              <ArrowRight className="size-5" />
            </Link>
            <button
              onClick={openPalette}
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface/70 px-6 py-3 text-base text-ink-dim backdrop-blur transition hover:border-edge-strong hover:text-ink"
            >
              Explore the system
              <span className="flex items-center gap-0.5 rounded border border-edge px-1.5 py-0.5 font-mono text-xs">
                <Command className="size-3" />K
              </span>
            </button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {modules.map((m) => (
              <span
                key={m.name}
                className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/50 px-3.5 py-1.5 text-sm text-ink-dim backdrop-blur"
              >
                <m.icon className="size-4" strokeWidth={1.75} />
                {m.name}
              </span>
            ))}
          </div>
        </motion.div>

        <button
          onClick={() =>
            dashboardRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="group absolute bottom-32 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
        >
          See your dashboard
          <ChevronDown className="size-5 animate-bounce text-accent" />
        </button>
      </section>

      {/* Screen 2 — live dashboard */}
      <section
        ref={dashboardRef}
        id="dashboard"
        className="flex min-h-full flex-col items-center justify-center px-4 pb-32 pt-8 md:snap-start"
      >
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
            Live preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Your business, at a glance
          </h2>
        </div>

        <div className="grid w-full max-w-5xl gap-5 md:grid-cols-[1.2fr_1fr]">
          <Widget name="Your business modules" delay={0.1}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {modules.map((m) => (
                <Link
                  key={m.name}
                  href="/solutions"
                  className="group rounded-xl border border-edge bg-surface-2/60 p-4 transition hover:border-edge-strong hover:bg-surface-3"
                >
                  <m.icon
                    className="mb-3 size-6 text-ink-dim transition group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                  <p className="text-[15px] font-medium">{m.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                    <span
                      className={`size-1.5 rounded-full ${
                        m.status === "online" ? "bg-accent" : "bg-warn"
                      }`}
                    />
                    {m.status}
                  </p>
                </Link>
              ))}
            </div>
          </Widget>

          <div className="flex flex-col gap-5">
            <Widget name="Recent activity" delay={0.2}>
              <ul className="space-y-2.5">
                {activity.map((line) => (
                  <li
                    key={line}
                    className="flex items-center gap-2.5 text-sm leading-relaxed text-ink-dim"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            </Widget>

            <Widget name="At a glance" delay={0.3}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-accent">
                    99.9%
                  </p>
                  <p className="mt-1 text-xs text-ink-dim">uptime</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">&lt;24h</p>
                  <p className="mt-1 text-xs text-ink-dim">reply time</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">10+</p>
                  <p className="mt-1 text-xs text-ink-dim">services</p>
                </div>
              </div>
            </Widget>
          </div>

          <Widget name="Quick actions" delay={0.4} className="md:col-span-2">
            <div className="grid gap-3 sm:grid-cols-4">
              {quickActions.map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex items-center gap-3 rounded-xl border border-edge bg-surface-2/60 p-4 transition hover:border-edge-strong hover:bg-surface-3"
                >
                  <a.icon
                    className="size-5 text-ink-dim transition group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                  <span className="text-[15px] font-medium">{a.label}</span>
                </Link>
              ))}
              <button
                onClick={openPalette}
                className="group flex items-center gap-3 rounded-xl border border-edge bg-surface-2/60 p-4 text-left transition hover:border-edge-strong hover:bg-surface-3"
              >
                <Search
                  className="size-5 text-ink-dim transition group-hover:text-accent"
                  strokeWidth={1.75}
                />
                <span className="text-[15px] font-medium">Search</span>
              </button>
            </div>
          </Widget>
        </div>
      </section>
    </div>
  );
}
