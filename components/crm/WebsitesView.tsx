"use client";

import { ExternalLink, Globe, Rocket, ShieldCheck, TriangleAlert } from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { siteHealthFor } from "@/lib/portal/portal";
import { Card, EmptyState, PageHeader, SectionLabel } from "./ui";

/**
 * Agency-side website management: every client site's health on one board.
 * Read-only until real hosting hooks land — the same fixtures feed the
 * client-facing Website and Hosting tools.
 */
export default function WebsitesView() {
  const { state } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-16 md:p-8">
      <PageHeader
        title="Websites"
        subtitle="Every client site, its uptime, performance and deploys — the same live data their portals show."
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Globe className="size-6" strokeWidth={1.5} />}
          title="No client sites yet"
          hint="Win a deal and the client's site appears here with monitoring attached."
        />
      ) : (
        <div className="space-y-4">
          {clients.map((c) => {
            const site = siteHealthFor(c);
            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Globe className="size-6 shrink-0 text-accent" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">
                        {c.domain}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-dim">
                        <span className="status-dot size-1.5 rounded-full bg-accent" />
                        {c.name} · {site.plan} · {site.region}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://${c.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
                  >
                    <ExternalLink className="size-3.5" />
                    Open site
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-edge bg-surface-2/60 p-3">
                    <p className="text-lg font-semibold tabular-nums text-accent">
                      {site.uptime90d}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-dim">uptime · 90d</p>
                  </div>
                  <div className="rounded-xl border border-edge bg-surface-2/60 p-3">
                    <p className="text-lg font-semibold tabular-nums">
                      {site.visits30d.toLocaleString("en-US")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-dim">visits · 30d</p>
                  </div>
                  <div className="rounded-xl border border-edge bg-surface-2/60 p-3">
                    <p className="text-lg font-semibold tabular-nums">
                      {site.perf.performance}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-dim">performance</p>
                  </div>
                  <div className="rounded-xl border border-edge bg-surface-2/60 p-3">
                    <p className="flex items-center gap-1.5 text-lg font-semibold tabular-nums">
                      <ShieldCheck className="size-4 text-accent" />
                      {site.sslDaysLeft}d
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-dim">SSL renews</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-faint">
                  <span className="flex items-center gap-1.5">
                    <Rocket className="size-3.5" />
                    {site.deploys[0]
                      ? `Last deploy: ${site.deploys[0].label} · ${
                          site.deploys[0].daysAgo === 0
                            ? "today"
                            : `${site.deploys[0].daysAgo}d ago`
                        }`
                      : "No deploys yet"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {site.incidents.length > 0 ? (
                      <>
                        <TriangleAlert className="size-3.5 text-warn" />
                        {site.incidents.length}{" "}
                        {site.incidents.length === 1 ? "incident" : "incidents"} · 90d
                      </>
                    ) : (
                      "No incidents · 90d"
                    )}
                  </span>
                  <span>
                    Backups: daily · latest {site.backups[0]?.size ?? "—"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div>
        <SectionLabel>Coming with real hosting hooks</SectionLabel>
        <Card className="mt-3 p-5 text-sm leading-relaxed text-ink-dim">
          Visual content editing, one-click publishes with instant rollback,
          and broken-link checks run from this board. The client-facing view is
          already live in every portal — this is the control room side.
        </Card>
      </div>
    </div>
  );
}
