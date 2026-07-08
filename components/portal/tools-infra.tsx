"use client";

import { useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Globe,
  HardDrive,
  Network,
  RotateCcw,
  Server,
  ShieldCheck,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import type { Company } from "@/lib/crm/types";
import { fmtDate } from "@/lib/crm/types";
import {
  analyticsFor,
  siteHealthFor,
} from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";
import { Stat, ToolHeader } from "./tools";

/* ------------------------------------------------------------------ */
/* Hosting — plan, usage, backups, incidents                           */
/* ------------------------------------------------------------------ */

function UsageMeter({
  icon,
  label,
  used,
  limit,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="rounded-xl border border-edge bg-surface-2/60 p-4">
      <div className="flex items-center gap-2 text-sm text-ink-dim">
        {icon}
        {label}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        <span className="font-mono tabular-nums text-ink-dim">
          {used} {unit}
        </span>{" "}
        of {limit} {unit} · {pct}%
      </p>
    </div>
  );
}

export function HostingTool({ company }: { company: Company }) {
  const site = siteHealthFor(company);
  const [restored, setRestored] = useState<number | null>(null);

  const restore = (daysAgo: number) => {
    playSound("open");
    setRestored(daysAgo);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Server className="size-8 text-accent" strokeWidth={1.5} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Hosting</h1>
          <p className="flex items-center gap-1.5 text-xs text-ink-dim">
            <span className="status-dot size-1.5 rounded-full bg-accent" />
            {site.plan} · {site.region} · monitored around the clock
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="uptime · last 90 days" value={site.uptime90d} accent />
        <Stat label="edge region" value={site.region} />
        <Stat
          label="incidents · last 90 days"
          value={`${site.incidents.length}`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <UsageMeter
          icon={<Wifi className="size-4" />}
          label="Bandwidth this month"
          used={site.usage.bandwidthGb}
          limit={site.usage.bandwidthLimitGb}
          unit="GB"
        />
        <UsageMeter
          icon={<HardDrive className="size-4" />}
          label="Storage"
          used={site.usage.storageGb}
          limit={site.usage.storageLimitGb}
          unit="GB"
        />
      </div>

      {/* Backups */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Backups — daily snapshots
        </p>
        {restored !== null && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-dim p-4">
            <CheckCircle2 className="size-5 shrink-0 text-accent" />
            <p className="text-sm">
              Restore point queued — the team confirms before anything goes
              live. You&apos;ll get an update in your feed.
            </p>
          </div>
        )}
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {site.backups.map((b) => (
            <div key={b.daysAgo} className="flex items-center gap-3.5 p-4">
              <Archive className="size-4 shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {b.daysAgo === 0
                    ? "Today"
                    : b.daysAgo === 1
                      ? "Yesterday"
                      : `${b.daysAgo} days ago`}
                </p>
                <p className="text-xs text-ink-faint">
                  Full snapshot · {b.size}
                </p>
              </div>
              <button
                onClick={() => restore(b.daysAgo)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Incident history
        </p>
        <div className="mt-3 rounded-xl border border-edge bg-surface-2/60">
          {site.incidents.length === 0 ? (
            <div className="flex items-center gap-3 p-5">
              <CheckCircle2 className="size-5 shrink-0 text-accent" />
              <p className="text-sm text-ink-dim">
                No incidents in the last 90 days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-edge">
              {site.incidents.map((inc) => (
                <div key={inc.title} className="flex items-start gap-3.5 p-4">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
                  <div className="min-w-0">
                    <p className="text-sm">{inc.title}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {inc.daysAgo} days ago · resolved in {inc.durationMin} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Domains — registration, DNS, SSL                                    */
/* ------------------------------------------------------------------ */

export function DomainsTool({ company }: { company: Company }) {
  const site = siteHealthFor(company);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Network className="size-8 text-accent" strokeWidth={1.5} />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {company.domain}
          </h1>
          <p className="text-xs text-ink-dim">
            Managed by {site.registrar} · renews automatically in{" "}
            {site.domainRenewsInDays} days
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-4">
          <ShieldCheck className="size-6 shrink-0 text-accent" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">SSL certificate</p>
            <p className="text-xs text-ink-dim">
              Valid — auto-renews in {site.sslDaysLeft} days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-4">
          <Globe className="size-6 shrink-0 text-ink-dim" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">Registration</p>
            <p className="text-xs text-ink-dim">
              Active · renewal handled for you
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          DNS records — what each one does
        </p>
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {site.dns.map((r) => (
            <div
              key={`${r.type}-${r.name}-${r.value}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4"
            >
              <span className="w-14 shrink-0 rounded-md border border-edge bg-surface-3 px-2 py-0.5 text-center font-mono text-[11px] font-medium text-ink-dim">
                {r.type}
              </span>
              <span className="w-10 shrink-0 font-mono text-sm">{r.name}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-dim">
                {r.value}
              </span>
              <span className="w-full text-xs text-ink-faint sm:w-auto sm:text-right">
                {r.note}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="rounded-xl border border-edge bg-surface-2/60 p-5 text-sm leading-relaxed text-ink-dim">
        Records, registration and certificates are fully managed — nothing
        here needs your attention. Changing email providers or adding a
        subdomain? Send a support request and it&apos;s handled the same day.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analytics — traffic, sources, funnel                                */
/* ------------------------------------------------------------------ */

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        up ? "text-accent" : "text-danger"
      }`}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(value)}%
    </span>
  );
}

/** 30-day traffic bars — single series, hover reveals the day's numbers. */
function TrafficChart({ days }: { days: { at: number; visits: number; leads: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.visits));
  const active = hover !== null ? days[hover] : null;
  return (
    <div className="rounded-xl border border-edge bg-surface-2/60 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Daily visits · last 30 days
        </p>
        <p className="h-4 font-mono text-xs tabular-nums text-ink-dim">
          {active
            ? `${fmtDate(active.at)} — ${active.visits.toLocaleString("en-US")} visits, ${active.leads} leads`
            : ""}
        </p>
      </div>
      <div
        className="mt-4 flex h-28 items-end gap-[2px]"
        onPointerLeave={() => setHover(null)}
      >
        {days.map((d, i) => (
          <div
            key={d.at}
            onPointerEnter={() => setHover(i)}
            className="group flex h-full flex-1 cursor-default items-end"
          >
            <div
              className={`w-full rounded-t transition ${
                hover === i ? "bg-accent" : "bg-accent/60"
              }`}
              style={{ height: `${Math.max(4, (d.visits / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-faint">
        <span>{fmtDate(days[0].at)}</span>
        <span>{fmtDate(days[days.length - 1].at)}</span>
      </div>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <p className="w-36 shrink-0 truncate text-sm text-ink-dim">{label}</p>
      <div className="h-4 flex-1 overflow-hidden rounded bg-surface-3">
        <div
          className="h-full rounded bg-accent/70"
          style={{ width: `${Math.max(2, (value / max) * 100)}%` }}
        />
      </div>
      <p className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim">
        {display}
      </p>
    </div>
  );
}

export function AnalyticsTool({ company }: { company: Company }) {
  const data = analyticsFor(company);
  const maxSource = Math.max(...data.sources.map((s) => s.share));
  const maxPage = Math.max(...data.topPages.map((p) => p.views));
  const maxFunnel = data.funnel[0].value;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <ToolHeader
        title="Analytics"
        subtitle={`How ${company.domain} performed over the last 30 days — cookieless and privacy-friendly.`}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-edge bg-surface-2/60 p-4">
          <p className="text-xl font-semibold tabular-nums">
            {data.totals.visits.toLocaleString("en-US")}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-dim">
            visits <Delta value={data.deltas.visits} />
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2/60 p-4">
          <p className="text-xl font-semibold tabular-nums">
            {data.totals.leads}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-dim">
            leads <Delta value={data.deltas.leads} />
          </p>
        </div>
        <Stat label="visit → lead rate" value={data.totals.conversion} accent />
      </div>

      <TrafficChart days={data.days} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-edge bg-surface-2/60 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
            Where visitors come from
          </p>
          <div className="mt-4 space-y-2.5">
            {data.sources.map((s) => (
              <BarRow
                key={s.name}
                label={s.name}
                value={s.share}
                max={maxSource}
                display={`${s.share}%`}
              />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2/60 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
            Top pages
          </p>
          <div className="mt-4 space-y-2.5">
            {data.topPages.slice(0, 5).map((p) => (
              <BarRow
                key={p.path}
                label={p.path}
                value={p.views}
                max={maxPage}
                display={p.views.toLocaleString("en-US")}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-edge bg-surface-2/60 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          From visitor to conversation
        </p>
        <div className="mt-4 space-y-2.5">
          {data.funnel.map((f) => (
            <BarRow
              key={f.label}
              label={f.label}
              value={f.value}
              max={maxFunnel}
              display={f.value.toLocaleString("en-US")}
            />
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          Leads flow straight into {`the team's`} CRM — the same numbers you
          see here drive the follow-ups they make.
        </p>
      </div>
    </div>
  );
}
