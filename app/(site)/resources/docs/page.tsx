import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Blocks,
  Cable,
  FlaskConical,
} from "lucide-react";
import Window from "@/components/os/Window";
import { productModules, statusStyle } from "@/lib/products";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Franko OS documentation — what the platform is, how modules connect, and a reference for every module in the system.",
};

const concepts = [
  {
    icon: Blocks,
    name: "Modules",
    description:
      "Franko OS is built from modules — CRM, billing, hosting, analytics and more. Each one works on its own, and you only run the ones your business needs.",
  },
  {
    icon: Cable,
    name: "Connected data",
    description:
      "Modules share one data layer. A lead captured on your site is the same record your invoices, emails and analytics see — nothing is synced, because nothing is separate.",
  },
  {
    icon: FlaskConical,
    name: "The proving ground",
    description:
      "Every module runs Franko Labs' own agency before it ships to you. If it doesn't survive real client work, it doesn't ship.",
  },
];

export default function DocsPage() {
  return (
    <Window title="Documentation" path="~/resources/docs" size="lg">
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
            <BookOpen className="size-6 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                Franko OS documentation
              </h2>
              <span className="rounded-full border border-edge px-2.5 py-1 text-xs text-ink-dim">
                early access
              </span>
            </div>
            <p className="mt-0.5 text-base text-ink-dim">
              What the platform is, and how the pieces fit together.
            </p>
          </div>
        </div>

        <p className="mt-10 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          What is Franko OS
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          Franko OS is an operating system for running a business: your
          website, leads, billing, analytics and automations in one connected
          platform instead of a patchwork of disconnected tools. It currently
          powers Franko Labs itself and is rolling out to early-access users
          module by module. This documentation grows as modules ship —
          full setup guides arrive with each module&apos;s release.
        </p>

        <p className="mt-10 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Core concepts
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {concepts.map((c) => (
            <div
              key={c.name}
              className="rounded-xl border border-edge bg-surface-2/65 p-5"
            >
              <c.icon className="size-6 text-accent" strokeWidth={1.75} />
              <p className="mt-3 text-[15px] font-medium">{c.name}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-dim">
                {c.description}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Module reference
        </p>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-dim">
          Every module in the system, with its current status. Open one for
          its full overview and feature list.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {productModules.map((m) => {
            const s = statusStyle[m.status];
            return (
              <Link
                key={m.slug}
                href={`/products/${m.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-edge bg-surface-2/65 p-4 transition hover:border-edge-strong hover:bg-surface-2/70"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-3 text-ink-dim transition group-hover:text-accent">
                  <m.icon className="size-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="truncate text-[15px] font-medium">{m.name}</p>
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${s.dot}`}
                    />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink-dim">
                    {m.tagline}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
          <div>
            <p className="text-lg font-medium">Want access before launch?</p>
            <p className="mt-1 text-base text-ink-dim">
              Early-access users get modules as they ship — and a say in what
              ships next.
            </p>
          </div>
          <Link
            href="/contact?type=waitlist"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Join the waitlist
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </Window>
  );
}
