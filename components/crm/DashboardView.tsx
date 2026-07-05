"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Kanban,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { computePulse, overallPulse } from "@/lib/crm/pulse";
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

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        <Icon
          className={`size-4.5 ${accent ? "text-accent" : "text-ink-faint"}`}
          strokeWidth={1.75}
        />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{sub}</p>
    </Card>
  );
}

export default function DashboardView() {
  const { state } = useCrm();
  const { stageById, contactById } = useCrmLookups();
  const [now] = useState(() => Date.now());

  const metrics = useMemo(() => {
    const open = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "open",
    );
    const won = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "won",
    );
    const lost = state.deals.filter(
      (d) => stageById.get(d.stageId)?.kind === "lost",
    );
    const pipelineValue = open.reduce((s, d) => s + d.value, 0);
    const wonValue = won.reduce((s, d) => s + d.value, 0);
    const closed = won.length + lost.length;
    const winRate = closed === 0 ? 0 : Math.round((won.length / closed) * 100);
    const dueSoon = state.tasks.filter(
      (t) => !t.done && t.dueAt < now + 2 * DAY,
    ).length;

    const openStages = state.stages.filter((s) => s.kind === "open");
    const byStage = openStages.map((s) => {
      const deals = open.filter((d) => d.stageId === s.id);
      return {
        stage: s,
        count: deals.length,
        value: deals.reduce((sum, d) => sum + d.value, 0),
      };
    });
    const maxStageValue = Math.max(1, ...byStage.map((b) => b.value));

    return {
      open,
      pipelineValue,
      wonValue,
      winRate,
      dueSoon,
      byStage,
      maxStageValue,
    };
  }, [state, stageById, now]);

  const pulse = useMemo(() => computePulse(state, now), [state, now]);
  const pulseScore = overallPulse(pulse.health);
  const topSignals = pulse.signals
    .filter((s) => s.severity !== "info")
    .slice(0, 3);
  const recent = useMemo(
    () => [...state.activities].sort((a, b) => b.at - a.at).slice(0, 6),
    [state.activities],
  );

  const todayPlan = useMemo(() => {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + DAY;
    const events = state.events
      .filter((e) => !e.done && e.startAt >= dayStart.getTime() && e.startAt < dayEnd)
      .sort((a, b) => a.startAt - b.startAt);
    const tasks = state.tasks
      .filter((t) => !t.done && t.dueAt < dayEnd)
      .sort((a, b) => a.dueAt - b.dueAt)
      .slice(0, 3);
    return { events, tasks };
  }, [state.events, state.tasks, now]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
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
          Here&apos;s the state of {state.workspace.name} right now.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Pipeline value"
          value={fmtMoney(metrics.pipelineValue)}
          sub={`${metrics.open.length} open deals`}
          icon={CircleDollarSign}
          accent
        />
        <Kpi
          label="Won revenue"
          value={fmtMoney(metrics.wonValue)}
          sub="All time"
          icon={Trophy}
        />
        <Kpi
          label="Win rate"
          value={`${metrics.winRate}%`}
          sub="Of closed deals"
          icon={ArrowUpRight}
        />
        <Kpi
          label="Tasks due"
          value={String(metrics.dueSoon)}
          sub="Next 48 hours"
          icon={ListChecks}
        />
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
            {metrics.byStage.map((b) => (
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
                      width: `${Math.max(2, (b.value / metrics.maxStageValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {metrics.byStage.every((b) => b.count === 0) && (
              <p className="py-6 text-center text-sm text-ink-faint">
                No open deals yet — add your first from the Pipeline board.
              </p>
            )}
          </div>
        </Card>

        {/* Pulse summary */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Pulse</SectionLabel>
            <Link
              href="/crm/pulse"
              className="flex items-center gap-1 text-xs text-ink-dim transition hover:text-accent"
            >
              Open monitor <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex size-16 items-center justify-center">
              <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  strokeWidth="6"
                  className="stroke-surface-3"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(pulseScore / 100) * 169.6} 169.6`}
                  className={
                    pulseScore >= 72
                      ? "stroke-accent"
                      : pulseScore >= 45
                        ? "stroke-warn"
                        : "stroke-danger"
                  }
                />
              </svg>
              <span className="absolute font-mono text-lg font-semibold tabular-nums">
                {pulseScore}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-dim">
              Average health across {pulse.health.length} open deal
              {pulse.health.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {topSignals.map((s) => (
              <Link
                key={s.id}
                href="/crm/pulse"
                className="flex items-start gap-2.5 rounded-lg border border-edge bg-surface-2/50 p-3 transition hover:border-edge-strong"
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${
                    s.severity === "critical" ? "bg-danger" : "bg-warn"
                  }`}
                />
                <span className="min-w-0 text-xs leading-relaxed text-ink-dim">
                  <span className="block truncate font-medium text-ink">
                    {s.title}
                  </span>
                </span>
              </Link>
            ))}
            {topSignals.length === 0 && (
              <p className="flex items-center gap-2 rounded-lg border border-edge bg-surface-2/50 p-3 text-xs text-ink-dim">
                <Activity className="size-4 text-accent" />
                All clear — every open deal is on cadence.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Today */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Today</SectionLabel>
          <Link
            href="/crm/calendar"
            className="flex items-center gap-1 text-xs text-ink-dim transition hover:text-accent"
          >
            Open calendar <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {todayPlan.events.map((e) => (
              <Link
                key={e.id}
                href="/crm/calendar"
                className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5 transition hover:border-edge-strong"
              >
                <CalendarDays className="size-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {e.title}
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-ink-faint">
                  {fmtTime(e.startAt)}
                </span>
              </Link>
            ))}
            {todayPlan.events.length === 0 && (
              <p className="rounded-lg border border-dashed border-edge px-3 py-4 text-center text-xs text-ink-faint">
                No events today — the calendar is clear.
              </p>
            )}
          </div>
          <div className="space-y-2">
            {todayPlan.tasks.map((t) => (
              <Link
                key={t.id}
                href="/crm/tasks"
                className="flex items-center gap-3 rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5 transition hover:border-edge-strong"
              >
                <ListChecks
                  className={`size-4 shrink-0 ${t.dueAt < now ? "text-danger" : "text-warn"}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {t.title}
                </span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {relTime(t.dueAt, now)}
                </span>
              </Link>
            ))}
            {todayPlan.tasks.length === 0 && (
              <p className="rounded-lg border border-dashed border-edge px-3 py-4 text-center text-xs text-ink-faint">
                No tasks due — nothing overdue either.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Recent activity */}
      <Card className="p-6">
        <SectionLabel>Recent activity</SectionLabel>
        <div className="mt-4 divide-y divide-edge">
          {recent.map((a) => {
            const Icon = activityIcon[a.type];
            const contact = a.contactId ? contactById.get(a.contactId) : null;
            return (
              <div key={a.id} className="flex items-start gap-3.5 py-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-2 text-ink-dim">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed">{a.summary}</p>
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
  );
}
