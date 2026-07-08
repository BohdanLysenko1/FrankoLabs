"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  FilePen,
  Globe,
  Kanban,
  LifeBuoy,
  ListChecks,
  Mail,
  MessageSquare,
  PackageOpen,
  Phone,
  Receipt,
  Users,
  Zap,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { computePulse, overallPulse } from "@/lib/crm/pulse";
import { siteHealthFor } from "@/lib/portal/portal";
import {
  DAY,
  fmtMoney,
  fmtTime,
  relTime,
  type ActivityType,
} from "@/lib/crm/types";
import { Avatar, Card, SectionLabel } from "./ui";

const activityIcon: Record<ActivityType, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Users,
  note: MessageSquare,
  stage: Kanban,
  system: Zap,
};

function StatTile({
  label,
  value,
  sub,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  href: string;
  icon: typeof Users;
  tone?: "default" | "accent" | "warn";
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-edge bg-surface/60 p-4 transition hover:border-edge-strong hover:bg-surface-2/60"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">
          {label}
        </p>
        <Icon
          className={`size-4 ${
            tone === "accent"
              ? "text-accent"
              : tone === "warn"
                ? "text-warn"
                : "text-ink-faint group-hover:text-ink-dim"
          }`}
          strokeWidth={1.75}
        />
      </div>
      <p
        className={`mt-2.5 text-xl font-semibold tracking-tight tabular-nums ${
          tone === "warn" ? "text-warn" : ""
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-ink-faint">{sub}</p>
    </Link>
  );
}

type AttentionItem = {
  id: string;
  icon: typeof Users;
  tone: string;
  text: string;
  hint: string;
  href: string;
};

/** Six paid-invoice buckets, oldest month first. */
function revenueByMonth(paid: { paidAt: number | null; amount: number }[], now: number) {
  const months: { label: string; total: number }[] = [];
  const cursor = new Date(now);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 5; i >= 0; i--) {
    const start = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() - i + 1, 1);
    months.push({
      label: start.toLocaleDateString("en-US", { month: "short" }),
      total: paid
        .filter(
          (p) =>
            p.paidAt !== null &&
            p.paidAt >= start.getTime() &&
            p.paidAt < end.getTime(),
        )
        .reduce((s, p) => s + p.amount, 0),
    });
  }
  return months;
}

export default function DashboardView() {
  const { state } = useCrm();
  const { stageById, contactById } = useCrmLookups();
  const [now] = useState(() => Date.now());

  const m = useMemo(() => {
    const open = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "open",
    );
    const pipelineValue = open.reduce((s, d) => s + d.value, 0);
    const due = state.invoices.filter((i) => i.status === "due");
    const overdue = due.filter((i) => i.dueAt < now);
    const paid = state.invoices.filter((i) => i.status === "paid");
    const collected30d = paid
      .filter((i) => (i.paidAt ?? 0) > now - 30 * DAY)
      .reduce((s, i) => s + i.amount, 0);
    const activeTickets = state.tickets.filter((t) => t.status !== "resolved");
    const pendingContracts = state.contracts.filter(
      (c) => c.status !== "signed",
    );
    const inReview = state.deliverables.filter(
      (d) => d.status === "in_review",
    );

    const openStages = state.stages.filter((s) => s.kind === "open");
    const byStage = openStages.map((s) => {
      const deals = open.filter((d) => d.stageId === s.id);
      return {
        stage: s,
        count: deals.length,
        value: deals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    return {
      open,
      pipelineValue,
      due,
      overdue,
      collected30d,
      activeTickets,
      pendingContracts,
      inReview,
      byStage,
      maxStageValue: Math.max(1, ...byStage.map((b) => b.value)),
      revenue: revenueByMonth(paid, now),
      clients: state.companies.filter((c) => c.isClient),
    };
  }, [state, stageById, now]);

  const pulse = useMemo(() => computePulse(state, now), [state, now]);
  const pulseScore = overallPulse(pulse.health);

  const attention = useMemo(() => {
    const companyName = (id: string | null) =>
      state.companies.find((c) => c.id === id)?.name ?? "a client";
    const items: AttentionItem[] = [];

    for (const i of m.overdue) {
      items.push({
        id: `inv-${i.id}`,
        icon: Receipt,
        tone: "text-danger",
        text: `${i.number} overdue — ${companyName(i.companyId)}, ${fmtMoney(i.amount)}`,
        hint: `due ${relTime(i.dueAt, now)}`,
        href: "/crm/billing",
      });
    }
    for (const t of m.activeTickets) {
      const last = t.messages[t.messages.length - 1];
      if (last?.from !== "client") continue;
      items.push({
        id: `tic-${t.id}`,
        icon: LifeBuoy,
        tone: "text-warn",
        text: `${companyName(t.companyId)} is waiting on support: “${t.subject}”`,
        hint: relTime(last.at, now),
        href: "/crm/support",
      });
    }
    for (const c of m.pendingContracts) {
      items.push({
        id: `con-${c.id}`,
        icon: FilePen,
        tone: c.status === "viewed" ? "text-warn" : "text-ink-dim",
        text: `“${c.title}” ${c.status === "viewed" ? "viewed but unsigned" : "out for signature"} — ${companyName(c.companyId)}`,
        hint: `sent ${relTime(c.sentAt, now)}`,
        href: "/crm/contracts",
      });
    }
    for (const d of m.inReview) {
      items.push({
        id: `del-${d.id}`,
        icon: PackageOpen,
        tone: "text-ink-dim",
        text: `${companyName(d.companyId)} is reviewing “${d.title}”`,
        hint: `posted ${relTime(d.postedAt, now)}`,
        href: "/crm/pipeline",
      });
    }
    for (const s of pulse.signals.filter((s) => s.severity === "critical").slice(0, 3)) {
      items.push({
        id: s.id,
        icon: Activity,
        tone: "text-danger",
        text: s.title,
        hint: "pulse",
        href: "/crm/pulse",
      });
    }
    return items.slice(0, 8);
  }, [m, pulse.signals, state.companies, now]);

  const todayPlan = useMemo(() => {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + DAY;
    return {
      events: state.events
        .filter((e) => !e.done && e.startAt >= dayStart.getTime() && e.startAt < dayEnd)
        .sort((a, b) => a.startAt - b.startAt)
        .slice(0, 4),
      tasks: state.tasks
        .filter((t) => !t.done && t.dueAt < dayEnd)
        .sort((a, b) => a.dueAt - b.dueAt)
        .slice(0, 4),
    };
  }, [state.events, state.tasks, now]);

  const recent = useMemo(
    () => [...state.activities].sort((a, b) => b.at - a.at).slice(0, 5),
    [state.activities],
  );

  const maxRevenue = Math.max(1, ...m.revenue.map((r) => r.total));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good{" "}
            {new Date(now).getHours() < 12
              ? "morning"
              : new Date(now).getHours() < 18
                ? "afternoon"
                : "evening"}
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            The whole of {state.workspace.name} on one screen.
          </p>
        </div>
        <Link
          href="/crm/pulse"
          className={`flex items-center gap-2 rounded-full border border-edge bg-surface-2/60 px-3.5 py-1.5 text-xs font-medium transition hover:border-edge-strong ${
            pulseScore >= 72
              ? "text-accent"
              : pulseScore >= 45
                ? "text-warn"
                : "text-danger"
          }`}
        >
          <Activity className="size-3.5" />
          Pulse {pulseScore}
        </Link>
      </div>

      {/* KPI row — every module reports in */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Pipeline"
          value={fmtMoney(m.pipelineValue)}
          sub={`${m.open.length} open deals`}
          href="/crm/pipeline"
          icon={CircleDollarSign}
          tone="accent"
        />
        <StatTile
          label="Outstanding"
          value={fmtMoney(m.due.reduce((s, i) => s + i.amount, 0))}
          sub={
            m.overdue.length > 0
              ? `${m.overdue.length} overdue`
              : `${m.due.length} open invoices`
          }
          href="/crm/billing"
          icon={Receipt}
          tone={m.overdue.length > 0 ? "warn" : "default"}
        />
        <StatTile
          label="Collected"
          value={fmtMoney(m.collected30d)}
          sub="last 30 days"
          href="/crm/billing"
          icon={CircleDollarSign}
        />
        <StatTile
          label="Contracts"
          value={String(m.pendingContracts.length)}
          sub="out for signature"
          href="/crm/contracts"
          icon={FilePen}
          tone={m.pendingContracts.some((c) => c.status === "viewed") ? "warn" : "default"}
        />
        <StatTile
          label="Support"
          value={String(m.activeTickets.length)}
          sub="active tickets"
          href="/crm/support"
          icon={LifeBuoy}
          tone={m.activeTickets.length > 0 ? "warn" : "default"}
        />
        <StatTile
          label="In review"
          value={String(m.inReview.length)}
          sub="deliverables with clients"
          href="/crm/pipeline"
          icon={PackageOpen}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Needs attention */}
        <Card className="p-6 lg:col-span-3">
          <SectionLabel>Needs attention</SectionLabel>
          <div className="mt-4 space-y-2">
            {attention.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5 transition hover:border-edge-strong"
                >
                  <Icon className={`size-4 shrink-0 ${a.tone}`} strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate text-sm">{a.text}</span>
                  <span className="shrink-0 text-xs text-ink-faint">{a.hint}</span>
                </Link>
              );
            })}
            {attention.length === 0 && (
              <p className="flex items-center gap-2 rounded-lg border border-edge bg-surface-2/50 p-4 text-sm text-ink-dim">
                <Activity className="size-4 text-accent" />
                Nothing needs you — pipeline on cadence, invoices current,
                queue clear.
              </p>
            )}
          </div>
        </Card>

        {/* Today */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Today</SectionLabel>
            <Link
              href="/crm/calendar"
              className="flex items-center gap-1 text-xs text-ink-dim transition hover:text-accent"
            >
              Calendar <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {todayPlan.events.map((e) => (
              <Link
                key={e.id}
                href="/crm/calendar"
                className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5 transition hover:border-edge-strong"
              >
                <CalendarDays className="size-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-ink-faint">
                  {fmtTime(e.startAt)}
                </span>
              </Link>
            ))}
            {todayPlan.tasks.map((t) => (
              <Link
                key={t.id}
                href="/crm/tasks"
                className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5 transition hover:border-edge-strong"
              >
                <ListChecks
                  className={`size-4 shrink-0 ${t.dueAt < now ? "text-danger" : "text-warn"}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {relTime(t.dueAt, now)}
                </span>
              </Link>
            ))}
            {todayPlan.events.length === 0 && todayPlan.tasks.length === 0 && (
              <p className="rounded-lg border border-dashed border-edge px-3 py-5 text-center text-xs text-ink-faint">
                Clear calendar, no tasks due. Rare — enjoy it.
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Pipeline by stage */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Pipeline by stage</SectionLabel>
            <Link
              href="/crm/pipeline"
              className="flex items-center gap-1 text-xs text-ink-dim transition hover:text-accent"
            >
              Open board <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-5 space-y-3.5">
            {m.byStage.map((b) => (
              <div key={b.stage.id}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{b.stage.name}</span>
                  <span className="font-mono text-xs tabular-nums text-ink-dim">
                    {b.count} · {fmtMoney(b.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent/80 transition-all"
                    style={{
                      width: `${Math.max(2, (b.value / m.maxStageValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {m.byStage.every((b) => b.count === 0) && (
              <p className="py-6 text-center text-sm text-ink-faint">
                No open deals yet — add your first from the Pipeline board.
              </p>
            )}
          </div>
        </Card>

        {/* Revenue collected by month */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Collected by month</SectionLabel>
            <Link
              href="/crm/billing"
              className="flex items-center gap-1 text-xs text-ink-dim transition hover:text-accent"
            >
              Billing <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-5 flex h-36 items-end gap-2">
            {m.revenue.map((r) => (
              <div key={r.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <p className="mb-1 truncate text-center font-mono text-[10px] tabular-nums text-ink-faint">
                  {r.total > 0 ? `$${Math.round(r.total / 1000)}k` : ""}
                </p>
                <div
                  className="w-full rounded-t bg-accent/70"
                  style={{
                    height: `${Math.max(r.total > 0 ? 6 : 2, (r.total / maxRevenue) * 82)}%`,
                  }}
                />
                <p className="mt-1.5 text-center text-[10px] text-ink-faint">
                  {r.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Client sites */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Client sites</SectionLabel>
            <Link
              href="/crm/websites"
              className="flex items-center gap-1 text-xs text-ink-dim transition hover:text-accent"
            >
              Websites <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {m.clients.map((c) => {
              const site = siteHealthFor(c);
              return (
                <Link
                  key={c.id}
                  href="/crm/websites"
                  className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5 transition hover:border-edge-strong"
                >
                  <Globe className="size-4 shrink-0 text-ink-faint" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {c.domain}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs tabular-nums text-ink-dim">
                    <span className="status-dot size-1.5 rounded-full bg-accent" />
                    {site.uptime90d}
                  </span>
                </Link>
              );
            })}
            {m.clients.length === 0 && (
              <p className="rounded-lg border border-dashed border-edge px-3 py-5 text-center text-xs text-ink-faint">
                Client sites appear here once a deal is won.
              </p>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="p-6 lg:col-span-3">
          <SectionLabel>Recent activity</SectionLabel>
          <div className="mt-3 divide-y divide-edge">
            {recent.map((a) => {
              const Icon = activityIcon[a.type];
              const contact = a.contactId ? contactById.get(a.contactId) : null;
              return (
                <div key={a.id} className="flex items-start gap-3.5 py-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-2 text-ink-dim">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-relaxed">{a.summary}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
                      {contact && (
                        <span className="flex items-center gap-1.5">
                          <Avatar name={contact.name} hue={contact.hue} size="sm" />
                          {contact.name}
                        </span>
                      )}
                      <span>{relTime(a.at, now)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-faint">
                Activity will appear here as you work deals.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
