import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Lock, ChevronRight } from "lucide-react";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Shipped work and case studies from Franko Labs, including Voyagr — an independent product proving our engineering pipeline.",
};

export default function ProjectsPage() {
  return (
    <Window title="Projects" path="~/projects" size="md">
      <div className="p-6 md:p-10">
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Our work
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Projects open like applications
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          Each case study covers the overview, technology, results, timeline
          and what we learned building it.
        </p>

        <div className="mt-8 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/65">
          <Link
            href="/projects/voyagr"
            className="group flex items-center gap-5 p-5 transition hover:bg-surface-2/70"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface-3 text-ink-dim transition group-hover:text-accent">
              <Compass className="size-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-medium">Voyagr</h3>
              <p className="mt-0.5 truncate text-base text-ink-dim">
                Independent product — proof of the Franko Labs engineering
                pipeline
              </p>
            </div>
            <ChevronRight className="ml-auto size-5 shrink-0 text-ink-faint transition group-hover:text-ink" />
          </Link>

          <div className="flex items-center gap-5 p-5 opacity-60">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface-3 text-ink-faint">
              <Lock className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-ink-dim">Client work</h3>
              <p className="mt-0.5 text-[15px] text-ink-faint">
                Case studies publishing soon — ask us about them on a call.
              </p>
            </div>
            <span className="ml-auto rounded-full border border-edge px-2.5 py-1 text-xs text-ink-faint">
              coming soon
            </span>
          </div>
        </div>
      </div>
    </Window>
  );
}
