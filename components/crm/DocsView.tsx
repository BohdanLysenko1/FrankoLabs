"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search, Users } from "lucide-react";
import { docArticles, type DocArticle } from "@/lib/docs";
import { useCrm } from "@/lib/crm/store";
import { Card, Drawer, PageHeader } from "./ui";

const CATEGORIES = [
  "All",
  ...Array.from(new Set(docArticles.map((a) => a.category))),
];

export default function DocsView() {
  const { state, actions } = useCrm();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [localActive, setLocalActive] = useState<DocArticle | null>(null);

  // Command palette requests land here via the store.
  const req = state.ui.openRequest;
  const active =
    localActive ??
    (req?.kind === "doc"
      ? (docArticles.find((a) => a.slug === req.id) ?? null)
      : null);
  const setActive = (article: DocArticle | null) => {
    setLocalActive(article);
    if (!article && req) actions.requestOpen(null);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docArticles.filter(
      (a) =>
        (category === "All" || a.category === category) &&
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.sections.some((s) => s.text.toLowerCase().includes(q))),
    );
  }, [query, category]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-16 md:p-8">
      <PageHeader
        title="Documentation"
        subtitle="The operating manual the business writes as it runs. Client-visible articles publish straight into every portal's Guides tool."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs…"
            className="w-full rounded-xl border border-edge bg-surface-2/60 py-2 pl-9 pr-3.5 text-sm outline-none transition focus:border-accent/50"
          />
        </div>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              category === c
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-edge bg-surface-2/60 text-ink-dim hover:border-edge-strong hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-edge">
        {results.map((a) => (
          <button
            key={a.slug}
            onClick={() => setActive(a)}
            className="flex w-full items-start gap-3.5 p-4 text-left transition hover:bg-surface-2/60"
          >
            <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-ink-faint">
                {a.summary}
              </p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {a.category} · {a.minutes} min · updated {a.updatedDaysAgo}d ago
              </p>
            </div>
            {a.clientVisible && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent-dim px-2.5 py-1 text-[11px] font-medium text-accent">
                <Users className="size-3" />
                in client portals
              </span>
            )}
          </button>
        ))}
        {results.length === 0 && (
          <p className="p-5 text-sm text-ink-faint">
            Nothing matches — try another search.
          </p>
        )}
      </Card>

      {active && (
        <Drawer open onClose={() => setActive(null)} title={active.title}>
          <div className="space-y-5">
            <p className="text-xs text-ink-faint">
              {active.category} · {active.minutes} min read
              {active.clientVisible ? " · published to client portals" : " · internal only"}
            </p>
            {active.sections.map((s, i) => (
              <div key={i}>
                {s.heading && (
                  <h3 className="mb-2 text-[15px] font-medium">{s.heading}</h3>
                )}
                <p className="text-sm leading-relaxed text-ink-dim">{s.text}</p>
              </div>
            ))}
          </div>
        </Drawer>
      )}
    </div>
  );
}
