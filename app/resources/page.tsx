import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, History, ScrollText, ArrowRight } from "lucide-react";
import Window from "@/components/os/Window";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Documentation, guides, changelog and FAQ for working with Franko Labs and Franko OS.",
};

const sections = [
  {
    icon: BookOpen,
    name: "Documentation",
    detail: "Franko OS docs",
    href: "/resources/docs",
  },
  {
    icon: ScrollText,
    name: "Guides",
    detail: `${guides.length} playbooks & how-tos`,
    href: "/resources/guides",
  },
  {
    icon: History,
    name: "Changelog",
    detail: "v0.3 — resources hub",
    href: "/resources/changelog",
  },
];

const faq = [
  {
    q: "What does “Website as a Service” include?",
    a: "Design, development, hosting, maintenance, updates and support — one monthly subscription instead of a large upfront project fee. You always have a current, fast, secure site.",
  },
  {
    q: "Do I own my website and data?",
    a: "Yes. Your domain, content and data are yours. If we ever part ways, everything is exportable and transferable.",
  },
  {
    q: "What is Franko OS and can I use it today?",
    a: "Franko OS is the platform we're building to run entire businesses — CRM, billing, hosting, analytics and automation in one system. It currently powers Franko Labs internally; join the waitlist to get early access as modules ship.",
  },
  {
    q: "Can I start with one service and add more later?",
    a: "That's the intended path. Most clients start with a website or an audit, then add modules — CRM, automation, marketing — as the value proves itself. Everything is built to connect, so nothing has to be redone later.",
  },
  {
    q: "What happens if I cancel my subscription?",
    a: "No hostages. You keep your domain, your content and your data — we hand everything over in standard formats and help with the transition. Subscriptions are monthly; there's no long-term lock-in.",
  },
  {
    q: "How fast do you respond?",
    a: "Within one business day for standard requests, and same-day for anything that affects a live site.",
  },
];

export default function ResourcesPage() {
  return (
    <Window title="Resources" path="~/resources" size="md">
      <div className="p-6 md:p-10">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Knowledge base
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Resources
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {sections.map((r) => (
            <Link
              key={r.name}
              href={r.href}
              className="group rounded-2xl border border-edge bg-surface-2/40 p-5 transition hover:border-edge-strong hover:bg-surface-2/70"
            >
              <r.icon
                className="size-7 text-ink-dim transition group-hover:text-accent"
                strokeWidth={1.75}
              />
              <p className="mt-3 text-lg font-medium">{r.name}</p>
              <p className="mt-1 text-[15px] text-ink-dim">{r.detail}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent">
                Open
                <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <h3 className="mt-12 text-xs font-medium uppercase tracking-widest text-ink-faint">
          Frequently asked questions
        </h3>
        <div className="mt-3 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/40">
          {faq.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none text-base font-medium marker:hidden">
                <span className="mr-2.5 inline-block font-mono text-accent transition group-open:rotate-90">
                  ›
                </span>
                {f.q}
              </summary>
              <p className="mt-3 pl-6 text-[15px] leading-relaxed text-ink-dim">
                {f.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
          <div>
            <p className="text-lg font-medium">Didn&apos;t find your answer?</p>
            <p className="mt-1 text-[15px] text-ink-dim">
              Ask us directly — we reply within one business day.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Contact us
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </Window>
  );
}
