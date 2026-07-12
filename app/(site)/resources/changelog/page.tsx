import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What's new in Franko OS and on frankolabs.com — releases, modules and site updates.",
};

type Release = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

const releases: Release[] = [
  {
    version: "v0.5.0",
    date: "July 3, 2026",
    title: "CRM: calendar, reports & automations",
    changes: [
      "Calendar module — month and week views, drag-to-reschedule, events linked to deals and contacts.",
      "Reports: won revenue by month, pipeline funnel, win rate by source, time-to-close.",
      "Automations that actually run: stage changes create follow-up tasks and portal updates automatically.",
      "Notifications inbox, ⌘K command palette, and a full deal editor on every pipeline card.",
      "Your workspace now persists between visits (local to your browser).",
    ],
  },
  {
    version: "v0.4.0",
    date: "July 1, 2026",
    title: "Franko CRM — early access",
    changes: [
      "The CRM module is live: pipeline board, contacts, companies, tasks and a dashboard, opening full-screen in its own tab.",
      "Pulse — deal-health monitoring that scores every open deal and tells you what needs attention next.",
      "Client portal preview: see exactly what your clients see, per project.",
      "Workspace onboarding, pipeline editor, team and billing settings.",
    ],
  },
  {
    version: "v0.3.0",
    date: "July 1, 2026",
    title: "Resources hub",
    changes: [
      "Documentation section with core concepts and a full module reference.",
      "Guides library: launch checklist, WaaS vs. custom, local SEO, project briefs.",
      "This changelog, now a page of its own.",
    ],
  },
  {
    version: "v0.2.0",
    date: "July 1, 2026",
    title: "Product module pages",
    changes: [
      "Every Franko OS module got its own landing page — overview, features and how it connects to the rest of the system.",
      "The module grid on Products is now clickable.",
      "Custom 404 window for paths that aren't mounted.",
      "Sitemap, robots and social-sharing metadata across the site.",
    ],
  },
  {
    version: "v0.1.0",
    date: "June 2026",
    title: "Site launch",
    changes: [
      "frankolabs.com launches as Franko OS — a desktop, windows, a dock and a command palette (⌘K) instead of another template site.",
      "Core pages: Solutions, Pricing, Products, Projects, About and Contact.",
      "Boot screen, sounds and wallpaper — because an operating system should feel like one.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <Window title="Changelog" path="~/resources/changelog" size="md">
      <div className="p-6 md:p-10">
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Resources
        </Link>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-edge bg-surface-3">
            <History className="size-6 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Changelog
            </h2>
            <p className="mt-0.5 text-base text-ink-dim">
              What&apos;s new in Franko OS and on this site.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {releases.map((r, i) => (
            <div key={r.version} className="relative pl-8">
              <span
                className={`absolute left-0 top-1.5 size-3 rounded-full border-2 border-surface ${
                  i === 0 ? "bg-accent status-dot" : "bg-ink-faint"
                }`}
              />
              {i < releases.length - 1 && (
                <span className="absolute left-[5px] top-6 h-[calc(100%+1rem)] w-px bg-edge" />
              )}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-accent">
                  {r.version}
                </span>
                <h3 className="text-lg font-medium">{r.title}</h3>
                <span className="text-xs text-ink-faint">{r.date}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {r.changes.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-2.5 text-base leading-relaxed text-ink-dim"
                  >
                    <span className="mt-2.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}
