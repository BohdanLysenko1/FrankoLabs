import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ImageIcon } from "lucide-react";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "Voyagr — Case Study",
  description:
    "Voyagr: an independent product built by Franko Labs, demonstrating the engineering pipeline behind every client project.",
};

/*
 * NOTE: The copy below is placeholder scaffolding — replace the bracketed
 * items with real Voyagr details (screenshots, metrics, dates).
 */

const tech = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "PostgreSQL",
  "Vercel",
];

const timeline = [
  { phase: "Concept & scoping", detail: "[dates]" },
  { phase: "Design system & prototype", detail: "[dates]" },
  { phase: "Build & internal testing", detail: "[dates]" },
  { phase: "Launch & iteration", detail: "[dates]" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-widest text-ink-faint">
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
              — from brand and design system to engineering and deployment. It
              exists to prove the same pipeline we use for client work:
              [replace with a two-sentence description of what Voyagr does and
              who it&apos;s for].
            </p>
          </section>

          <section>
            <SectionHeading>screenshots</SectionHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-edge-strong bg-surface-2/40 text-ink-faint"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <ImageIcon className="size-5" />
                    screenshot {i} — drop in /public
                  </span>
                </div>
              ))}
            </div>
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
          </section>

          <section>
            <SectionHeading>results</SectionHeading>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
              [Replace with real outcomes: launch metrics, performance scores,
              user numbers — whatever proves the point best.]
            </p>
          </section>

          <section>
            <SectionHeading>timeline</SectionHeading>
            <div className="mt-3 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/40">
              {timeline.map((t, i) => (
                <div key={t.phase} className="flex items-center gap-4 p-4">
                  <span className="font-mono text-sm text-ink-faint">
                    0{i + 1}
                  </span>
                  <span className="text-[15px] font-medium">{t.phase}</span>
                  <span className="ml-auto text-sm text-ink-faint">
                    {t.detail}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading>lessons learned</SectionHeading>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
              [Replace with 2–3 honest takeaways — what you&apos;d do
              differently, what surprised you. This section builds more trust
              than the results do.]
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
