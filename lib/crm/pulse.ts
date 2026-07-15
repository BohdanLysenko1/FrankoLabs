import { DAY, type CrmState, type Deal } from "./types";

/**
 * Pulse — the system monitor for your relationships.
 *
 * Every open deal gets a live health score (0–100) computed from how recently
 * it was touched, how long it has sat in its current stage, and whether its
 * follow-up tasks are overdue. Pulse turns those scores into a prioritized
 * feed of signals with one-click fixes — the CRM tells you what to do next
 * instead of waiting to be searched.
 */

export type HealthStatus = "healthy" | "cooling" | "at-risk";

export type DealHealth = {
  dealId: string;
  score: number;
  status: HealthStatus;
  daysSinceTouch: number;
  daysInStage: number;
  overdueTasks: number;
  /** Company-level friction: overdue invoices at this deal's company. */
  overdueInvoices: number;
  /** Company-level friction: open tickets untouched for 3+ days. */
  staleTickets: number;
  /** Expected touch cadence for the deal's stage, in days. */
  cadence: number;
};

export type SignalSeverity = "critical" | "warning" | "info";

export type Signal = {
  id: string;
  severity: SignalSeverity;
  title: string;
  detail: string;
  dealId: string;
  /** Suggested one-click fix, handled by the Pulse UI. */
  action: "log-touch" | "create-task" | "open-deal";
  actionLabel: string;
};

/** How often (days) a deal in each open-stage position expects a touch. */
const CADENCE_BY_POSITION = [1, 3, 5, 4, 3];
const DEFAULT_CADENCE = 4;

export const healthStyle: Record<
  HealthStatus,
  { label: string; text: string; bar: string; dot: string }
> = {
  healthy: {
    label: "healthy",
    text: "text-accent",
    bar: "bg-accent",
    dot: "bg-accent",
  },
  cooling: {
    label: "cooling",
    text: "text-warn",
    bar: "bg-warn",
    dot: "bg-warn",
  },
  "at-risk": {
    label: "at risk",
    text: "text-danger",
    bar: "bg-danger",
    dot: "bg-danger",
  },
};

function stageCadence(state: CrmState, stageId: string): number {
  const openStages = state.stages.filter((s) => s.kind === "open");
  const idx = openStages.findIndex((s) => s.id === stageId);
  if (idx === -1) return DEFAULT_CADENCE;
  return CADENCE_BY_POSITION[idx] ?? DEFAULT_CADENCE;
}

function lastTouchAt(state: CrmState, deal: Deal): number {
  let last = deal.createdAt;
  for (const a of state.activities) {
    if (a.dealId === deal.id && a.at > last) last = a.at;
  }
  return last;
}

export function computeDealHealth(
  state: CrmState,
  deal: Deal,
  now: number = Date.now(),
): DealHealth {
  const cadence = stageCadence(state, deal.stageId);
  const daysSinceTouch = Math.max(
    0,
    Math.floor((now - lastTouchAt(state, deal)) / DAY),
  );
  const daysInStage = Math.max(
    0,
    Math.floor((now - deal.stageChangedAt) / DAY),
  );
  const overdueTasks = state.tasks.filter(
    (t) => t.dealId === deal.id && !t.done && t.dueAt < now,
  ).length;
  // Friction elsewhere in the relationship bleeds into deal health: unpaid
  // invoices and unanswered tickets make every next conversation harder.
  const overdueInvoices = deal.companyId
    ? state.invoices.filter(
        (i) =>
          i.companyId === deal.companyId && i.status !== "paid" && i.dueAt < now,
      ).length
    : 0;
  const staleTickets = deal.companyId
    ? state.tickets.filter(
        (t) =>
          t.companyId === deal.companyId &&
          t.status !== "resolved" &&
          now - t.updatedAt > 3 * DAY,
      ).length
    : 0;

  let score = 100;
  // Silence past the expected cadence is the main killer.
  score -= Math.max(0, daysSinceTouch - cadence) * 9;
  // Sitting in one stage far beyond cadence means the deal is stalling.
  if (daysInStage > cadence * 3) score -= 15;
  score -= overdueTasks * 12;
  score -= overdueInvoices * 8;
  score -= staleTickets * 6;

  score = Math.max(3, Math.min(100, Math.round(score)));
  const status: HealthStatus =
    score >= 72 ? "healthy" : score >= 45 ? "cooling" : "at-risk";

  return {
    dealId: deal.id,
    score,
    status,
    daysSinceTouch,
    daysInStage,
    overdueTasks,
    overdueInvoices,
    staleTickets,
    cadence,
  };
}

export function computePulse(
  state: CrmState,
  now: number = Date.now(),
): { health: DealHealth[]; signals: Signal[] } {
  const openDeals = state.deals.filter((deal) => {
    const stage = state.stages.find((s) => s.id === deal.stageId);
    return stage?.kind === "open";
  });

  const health = openDeals
    .map((deal) => computeDealHealth(state, deal, now))
    .sort((a, b) => a.score - b.score);

  const signals: Signal[] = [];
  const dealById = new Map(state.deals.map((deal) => [deal.id, deal]));
  const stageName = (id: string) =>
    state.stages.find((s) => s.id === id)?.name ?? id;

  for (const h of health) {
    const deal = dealById.get(h.dealId);
    if (!deal) continue;

    if (h.daysSinceTouch > h.cadence * 2) {
      signals.push({
        id: `sig-cold-${deal.id}`,
        severity: h.status === "at-risk" ? "critical" : "warning",
        title: `${deal.name} is going cold`,
        detail: `No touch in ${h.daysSinceTouch} days — deals in ${stageName(deal.stageId)} expect contact every ${h.cadence}. Log a call or email to restart the clock.`,
        dealId: deal.id,
        action: "log-touch",
        actionLabel: "Log a touch",
      });
    } else if (h.daysSinceTouch > h.cadence) {
      signals.push({
        id: `sig-due-${deal.id}`,
        severity: "warning",
        title: `${deal.name} is due a follow-up`,
        detail: `Last touch was ${h.daysSinceTouch} days ago; the ${stageName(deal.stageId)} cadence is every ${h.cadence} days.`,
        dealId: deal.id,
        action: "create-task",
        actionLabel: "Create follow-up",
      });
    }

    if (h.overdueTasks > 0) {
      signals.push({
        id: `sig-task-${deal.id}`,
        severity: h.overdueTasks > 1 ? "critical" : "warning",
        title: `${h.overdueTasks} overdue task${h.overdueTasks > 1 ? "s" : ""} on ${deal.name}`,
        detail: `Follow-ups on this deal are past due. Clear them or reschedule before the thread dies.`,
        dealId: deal.id,
        action: "open-deal",
        actionLabel: "Review tasks",
      });
    }

    if (h.daysInStage > h.cadence * 3 && h.daysSinceTouch <= h.cadence * 2) {
      signals.push({
        id: `sig-stall-${deal.id}`,
        severity: "warning",
        title: `${deal.name} is stalling in ${stageName(deal.stageId)}`,
        detail: `${h.daysInStage} days in this stage. Time to force a decision: propose a deadline or a scoped-down option.`,
        dealId: deal.id,
        action: "create-task",
        actionLabel: "Plan next step",
      });
    }

    if (h.overdueInvoices > 0) {
      signals.push({
        id: `sig-invoice-${deal.id}`,
        severity: "warning",
        title: `Billing friction at ${deal.name}`,
        detail: `${h.overdueInvoices} overdue invoice${h.overdueInvoices > 1 ? "s" : ""} at this client. Money friction sours deal conversations — nudge it before the next touch.`,
        dealId: deal.id,
        action: "open-deal",
        actionLabel: "Review client",
      });
    }

    if (h.staleTickets > 0) {
      signals.push({
        id: `sig-ticket-${deal.id}`,
        severity: "warning",
        title: `Unanswered support at ${deal.name}`,
        detail: `${h.staleTickets} open ticket${h.staleTickets > 1 ? "s" : ""} untouched for 3+ days at this client. Slow support erodes the trust the deal depends on.`,
        dealId: deal.id,
        action: "open-deal",
        actionLabel: "Review client",
      });
    }

    if (h.status === "healthy" && h.daysInStage <= 3 && h.daysSinceTouch <= 1) {
      signals.push({
        id: `sig-momentum-${deal.id}`,
        severity: "info",
        title: `${deal.name} has momentum`,
        detail: `Touched in the last day and moving through ${stageName(deal.stageId)}. Keep the rhythm — momentum closes deals.`,
        dealId: deal.id,
        action: "open-deal",
        actionLabel: "View deal",
      });
    }
  }

  const order: Record<SignalSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  signals.sort((a, b) => order[a.severity] - order[b.severity]);

  return { health, signals };
}

/** Average health across open deals — the workspace "pipeline pulse". */
export function overallPulse(health: DealHealth[]): number {
  if (health.length === 0) return 100;
  return Math.round(
    health.reduce((sum, h) => sum + h.score, 0) / health.length,
  );
}
