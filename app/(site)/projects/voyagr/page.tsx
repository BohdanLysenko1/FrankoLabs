import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Layers,
  Rocket,
  SearchCheck,
} from "lucide-react";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "Voyagr — Case Study",
  description:
    "Voyagr: an independent product built by Franko Labs, demonstrating the engineering pipeline behind every client project.",
};

const tech = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "PostgreSQL",
  "Vercel",
];

const timeline = [
  {
    icon: SearchCheck,
    phase: "Concept & scoping",
    detail:
      "Problem framing, competitive review, and a written spec before any pixels — the same brief we produce for client work.",
  },
  {
    icon: Layers,
    phase: "Design system & prototype",
    detail:
      "Tokens, components and a clickable prototype first, so every screen after that is assembly instead of invention.",
  },
  {
    icon: GitBranch,
    phase: "Build & internal testing",
    detail:
      "Typed end to end, reviewed on every merge, and dogfooded internally until the rough edges were gone.",
  },
  {
    icon: Rocket,
    phase: "Launch & iteration",
    detail:
      "Shipped behind analytics from day one; the roadmap is driven by what real usage shows, not by opinion.",
  },
];

const principles = [
  {
    title: "One pipeline for everything",
    body: "Voyagr runs through the exact process client projects do — brief, design system, typed build, review, deploy. If the pipeline breaks, we feel it before a client ever would.",
  },
  {
    title: "The design system pays for itself",
    body: "Investing in tokens and components before pages felt slow for a week and then made every following week faster. We now refuse to build page-first.",
  },
  {
    title: "Dogfooding beats QA theater",
    body: "Using the product daily surfaced issues no test plan listed. Every Franko Labs engagement now includes a real-usage pass before launch.",
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
      {children}
    </h3>
  );
}

export default function VoyagrPage() {
  return (
    <Window title="Voyagr" path="~/projects/voyagr" size="lg">
      <div className="p-6 md:p-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Back to projects
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">Voyagr</h2>
          <span className="rounded-full border border-edge px-2.5 py-1 text-xs text-ink-dim">
            independent product
          </span>
        </div>

        <div className="mt-8 space-y-10">
          <section>
            <SectionHeading>overview</SectionHeading>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
              Voyagr is an independent product built end-to-end by Franko Labs
              — from brand and design system to engineering and deployment.
              It exists to prove the pipeline we sell: when we tell a client
              &ldquo;this is how we build,&rdquo; Voyagr is the evidence. Every
              practice on this page — the spec-first scoping, the
              system-before-screens design work, the typed, reviewed build —
              is the same practice a client project gets.
            </p>
          </section>

          <section>
            <SectionHeading>technology</SectionHeading>
            <div className="mt-3 flex flex-wrap gap-2">
              {tech.map((t) => (
                <span
                  key={t}
                  className="rounded-lg border border-edge bg-surface-2/60 px-3 py-1.5 text-sm text-ink-dim"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-3 max-w-2xl text-sm text-ink-faint">
              The same stack that powers Franko OS and this website — one
              toolchain, deeply known, instead of a new framework per project.
            </p>
          </section>

          <section>
            <SectionHeading>how it was built</SectionHeading>
            <div className="mt-3 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/65">
              {timeline.map((t, i) => (
                <div key={t.phase} className="flex gap-4 p-4">
                  <span className="mt-0.5 font-mono text-sm text-ink-faint">
                    0{i + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="flex items-center gap-2 text-[15px] font-medium">
                      <t.icon className="size-4 text-accent" strokeWidth={1.75} />
                      {t.phase}
                    </span>
                    <p className="mt-1 text-sm leading-relaxed text-ink-faint">
                      {t.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading>what it taught us</SectionHeading>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {principles.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-edge bg-surface-2/65 p-5"
                >
                  <h4 className="text-[15px] font-medium">{p.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-ink-faint">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-2xl text-sm text-ink-faint">
              The full case study — screenshots, launch metrics and the honest
              numbers — is being written up now. Ask us about it on a call in
              the meantime.
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
            <p className="text-lg font-medium">
              Want something built with the same pipeline?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
            >
              Start a project
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </Window>
  );
}
