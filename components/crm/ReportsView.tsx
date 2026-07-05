"use client";

import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Clock,
  Percent,
  TrendingUp,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { DAY, fmtMoney } from "@/lib/crm/types";
import { Card, PageHeader, SectionLabel } from "./ui";

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Clock;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        <Icon className="size-4.5 text-ink-faint" strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{sub}</p>
    </Card>
  );
}

export default function ReportsView() {
  const { state } = useCrm();
  const { stageById } = useCrmLookups();
  const [now] = useState(() => Date.now());

  const report = useMemo(() => {
    const won = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "won",
    );
    const lost = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "lost",
    );
    const open = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "open",
    );

    const wonValue = won.reduce((s, d) => s + d.value, 0);
    const closed = won.length + lost.length;
    const winRate = closed === 0 ? 0 : Math.round((won.length / closed) * 100);
    const avgDeal = won.length === 0 ? 0 : Math.round(wonValue / won.length);
    const avgCycle =
      won.length === 0
        ? 0
        : Math.round(
            won.reduce(
              (s, d) => s + ((d.closedAt ?? d.createdAt) - d.createdAt) / DAY,
              0,
            ) / won.length,
          );

    // Won revenue per month, last 6 months.
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now);
      m.setDate(1);
      m.setHours(0, 0, 0, 0);
      m.setMonth(m.getMonth() - i);
      const next = new Date(m);
      next.setMonth(next.getMonth() + 1);
      months.push({
        label: m.toLocaleDateString("en-US", { month: "short" }),
        value: won
          .filter(
            (d) =>
              d.closedAt &&
              d.closedAt >= m.getTime() &&
              d.closedAt < next.getTime(),
          )
          .reduce((s, d) => s + d.value, 0),
      });
    }
    const maxMonth = Math.max(1, ...months.map((m) => m.value));

    // Open pipeline distribution per stage.
    const openStages = state.stages.filter((s) => s.kind === "open");
    const funnel = openStages.map((s) => {
      const deals = open.filter((d) => d.stageId === s.id);
      return {
        stage: s,
        count: deals.length,
        value: deals.reduce((sum, d) => sum + d.value, 0),
      };
    });
    const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));

    // Win rate by source across closed deals.
    const sources = [...new Set([...won, ...lost].map((d) => d.source))];
    const bySource = sources
      .map((source) => {
        const w = won.filter((d) => d.source === source).length;
        const l = lost.filter((d) => d.source === source).length;
        return {
          source,
          won: w,
          total: w + l,
          rate: Math.round((w / Math.max(1, w + l)) * 100),
          value: won
            .filter((d) => d.source === source)
            .reduce((s, d) => s + d.value, 0),
        };
      })
      .sort((a, b) => b.value - a.value);

    return { wonValue, winRate, avgDeal, avgCycle, months, maxMonth, funnel, maxFunnel, bySource };
  }, [state.deals, state.stages, stageById, now]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Reports"
        subtitle="Where revenue comes from and how deals move — computed live from your pipeline."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Won revenue"
          value={fmtMoney(report.wonValue)}
          sub="All time"
          icon={CircleDollarSign}
        />
        <Kpi
          label="Win rate"
          value={`${report.winRate}%`}
          sub="Of closed deals"
          icon={Percent}
        />
        <Kpi
          label="Avg deal size"
          value={fmtMoney(report.avgDeal)}
          sub="Won deals"
          icon={TrendingUp}
        />
        <Kpi
          label="Avg time to close"
          value={`${report.avgCycle}d`}
          sub="Created → won"
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by month */}
        <Card className="p-6">
          <SectionLabel>Won revenue — last 6 months</SectionLabel>
          <div className="mt-8 flex h-36 items-end gap-3">
            {report.months.map((m) => (
              <div
                key={m.label}
                className="relative flex h-full flex-1 items-end"
              >
                {m.value > 0 && (
                  <span
                    className="absolute inset-x-0 pb-1 text-center font-mono text-[10px] tabular-nums text-ink-faint"
                    style={{
                      bottom: `${Math.max(3, (m.value / report.maxMonth) * 100)}%`,
                    }}
                  >
                    {fmtMoney(m.value)}
                  </span>
                )}
                <div
                  className={`w-full rounded-t-lg ${m.value > 0 ? "bg-accent/80" : "bg-surface-3"}`}
                  style={{
                    height: `${Math.max(3, (m.value / report.maxMonth) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {report.months.map((m) => (
              <span
                key={m.label}
                className="flex-1 text-center text-xs text-ink-faint"
              >
                {m.label}
              </span>
            ))}
          </div>
        </Card>

        {/* Pipeline funnel */}
        <Card className="p-6">
          <SectionLabel>Open pipeline by stage</SectionLabel>
          <div className="mt-5 space-y-3.5">
            {report.funnel.map((f) => (
              <div key={f.stage.id}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{f.stage.name}</span>
                  <span className="font-mono text-xs tabular-nums text-ink-dim">
                    {f.count} · {fmtMoney(f.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-sky-400/80"
                    style={{
                      width: `${Math.max(2, (f.value / report.maxFunnel) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {report.funnel.every((f) => f.count === 0) && (
              <p className="py-6 text-center text-sm text-ink-faint">
                No open deals to chart yet.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Win rate by source */}
      <Card className="p-6">
        <SectionLabel>Performance by source</SectionLabel>
        <div className="mt-4 divide-y divide-edge">
          {report.bySource.map((s) => (
            <div key={s.source} className="flex items-center gap-4 py-3.5">
              <span className="w-36 shrink-0 truncate text-sm font-medium">
                {s.source}
              </span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={`h-full rounded-full ${s.rate >= 50 ? "bg-accent" : "bg-warn"}`}
                  style={{ width: `${Math.max(2, s.rate)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim">
                {s.rate}%
              </span>
              <span className="hidden w-24 shrink-0 text-right font-mono text-xs tabular-nums text-ink-faint sm:block">
                {s.won}/{s.total} won
              </span>
              <span className="hidden w-24 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim md:block">
                {fmtMoney(s.value)}
              </span>
            </div>
          ))}
          {report.bySource.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-faint">
              Close a few deals and source performance shows up here.
            </p>
          )}
        </div>
      </Card>

      <p className="text-xs leading-relaxed text-ink-faint">
        Numbers update instantly as deals move through the pipeline. When
        Analytics and Billing modules ship, traffic and invoice data will join
        this view.
      </p>
    </div>
  );
}
