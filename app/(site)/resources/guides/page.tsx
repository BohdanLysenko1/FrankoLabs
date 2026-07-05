import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, ScrollText } from "lucide-react";
import Window from "@/components/os/Window";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Playbooks and how-tos from Franko Labs: launching websites, local SEO, project briefs and choosing the right engagement model.",
};

export default function GuidesPage() {
  return (
    <Window title="Guides" path="~/resources/guides" size="md">
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
            <ScrollText className="size-6 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Guides</h2>
            <p className="mt-0.5 text-[15px] text-ink-dim">
              Playbooks &amp; how-tos — the same advice we give clients.
            </p>
          </div>
        </div>

        <div className="mt-8 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/40">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/resources/guides/${g.slug}`}
              className="group flex items-start gap-5 p-5 transition hover:bg-surface-2/70"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-medium transition group-hover:text-accent">
                    {g.title}
                  </h3>
                </div>
                <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink-dim">
                  {g.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-ink-faint">
                  <span className="flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {g.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {g.readTime}
                  </span>
                </div>
              </div>
              <ArrowRight className="ml-auto mt-1 size-5 shrink-0 text-ink-faint opacity-0 transition group-hover:text-accent group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </Window>
  );
}
