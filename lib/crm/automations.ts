import {
  type AutomationAction,
  type AutomationCondition,
  type AutomationRule,
  type AutomationTrigger,
  type AutomationTriggerType,
  fmtMoney,
} from "./types";

/**
 * Single source for the automation engine's client half: the trigger/action
 * catalog that drives the builder UI, rule normalization for legacy saves,
 * and the matching + interpolation semantics shared with the demo evaluator.
 * The Postgres executor (app.run_automation_event) mirrors these semantics —
 * keep the two in sync when adding trigger or action types.
 */

/* ------------------------------------------------------------------ */
/* Event payloads                                                      */
/* ------------------------------------------------------------------ */

/** Display strings + ids an event carries; also the interpolation vars. */
export type AutomationEventPayload = {
  /** Primary display name (deal name, invoice label, ticket subject…). */
  name?: string;
  deal?: string;
  company?: string;
  contact?: string;
  invoice?: string;
  amount?: number;
  dealId?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  invoiceId?: string | null;
  stageId?: string | null;
  status?: string;
};

export type AutomationEvent = {
  type: AutomationTriggerType;
  payload: AutomationEventPayload;
};

/* ------------------------------------------------------------------ */
/* Catalog (drives the builder UI)                                     */
/* ------------------------------------------------------------------ */

export type TriggerParam = "stageId" | "days" | "hours" | "weeks" | "pct" | "status";

export type TriggerMeta = {
  type: AutomationTriggerType;
  label: string;
  /** Extra builder inputs beyond the type itself. */
  params: TriggerParam[];
  /** Time-based triggers run on the hourly sweep — db mode only. */
  sweep: boolean;
};

export type TriggerFamily = {
  id: "sales" | "money" | "delivery" | "clients";
  label: string;
  triggers: TriggerMeta[];
};

export const TRIGGER_FAMILIES: TriggerFamily[] = [
  {
    id: "sales",
    label: "Sales",
    triggers: [
      { type: "lead-created", label: "Lead created", params: [], sweep: false },
      { type: "lead-untouched", label: "Lead untouched for N days", params: ["days"], sweep: true },
      { type: "deal-created", label: "Deal created", params: [], sweep: false },
      { type: "deal-stage-enter", label: "Deal enters stage", params: ["stageId"], sweep: false },
      { type: "deal-stalled", label: "Deal stalled in stage N days", params: ["days"], sweep: true },
      { type: "deal-won", label: "Deal won", params: [], sweep: false },
      { type: "deal-lost", label: "Deal lost", params: [], sweep: false },
    ],
  },
  {
    id: "money",
    label: "Money",
    triggers: [
      { type: "invoice-created", label: "Invoice created", params: [], sweep: false },
      { type: "invoice-due-soon", label: "Invoice due in N days", params: ["days"], sweep: true },
      { type: "invoice-overdue", label: "Invoice overdue N days", params: ["days"], sweep: true },
      { type: "invoice-paid", label: "Invoice paid in full", params: [], sweep: false },
      { type: "payment-recorded", label: "Payment recorded", params: [], sweep: false },
      { type: "retainer-hours", label: "Retainer hours reach N%", params: ["pct"], sweep: true },
      { type: "retainer-billed", label: "Retainer billed", params: [], sweep: false },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    triggers: [
      { type: "task-overdue", label: "Task overdue", params: [], sweep: true },
      { type: "task-completed", label: "Task completed", params: [], sweep: false },
      { type: "ticket-created", label: "Ticket opened", params: [], sweep: false },
      { type: "ticket-no-reply", label: "Ticket unanswered N hours", params: ["hours"], sweep: true },
      { type: "ticket-status", label: "Ticket status becomes…", params: ["status"], sweep: false },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    triggers: [
      { type: "portal-activated", label: "Client activates portal", params: [], sweep: false },
      { type: "contract-viewed", label: "Contract viewed", params: [], sweep: false },
      { type: "contract-signed", label: "Contract signed", params: [], sweep: false },
      { type: "email-thread-inbound", label: "Inbound email received", params: [], sweep: false },
      { type: "contact-quiet", label: "Contact quiet for N weeks", params: ["weeks"], sweep: true },
    ],
  },
];

export const TRIGGER_META: Record<string, TriggerMeta> = Object.fromEntries(
  TRIGGER_FAMILIES.flatMap((f) => f.triggers.map((t) => [t.type, t])),
);

export function describeTrigger(trigger: AutomationTrigger, stageName?: string): string {
  const meta = TRIGGER_META[trigger.type];
  if (!meta) return trigger.type;
  return meta.label
    .replace("N days", `${trigger.days ?? "?"} days`)
    .replace("N hours", `${trigger.hours ?? "?"} hours`)
    .replace("N weeks", `${trigger.weeks ?? "?"} weeks`)
    .replace("N%", `${trigger.pct ?? "?"}%`)
    .replace("stage", stageName ? `stage “${stageName}”` : "stage")
    .replace("becomes…", trigger.status ? `becomes ${trigger.status}` : "changes");
}

export const ACTION_LABELS: Record<AutomationAction["type"], string> = {
  "create-task": "Create a task",
  "send-email": "Send an email",
  notify: "Notify the team",
  "update-record": "Update a record",
  "portal-update": "Post a portal update",
  "create-event": "Schedule an event",
};

export function describeAction(action: AutomationAction): string {
  switch (action.type) {
    case "create-task":
      return `create task “${action.title}”`;
    case "send-email":
      return `email ${action.to === "custom" ? action.customEmail || "…" : "the client"}: “${action.subject}”`;
    case "notify":
      return `notify ${action.target === "owner" ? "the owner" : "everyone"}`;
    case "update-record":
      return action.op === "move-deal-stage" ? "move the deal" : "pause the retainer";
    case "portal-update":
      return "post a client-visible update";
    case "create-event":
      return `schedule “${action.title}”`;
  }
}

/* ------------------------------------------------------------------ */
/* Normalization (legacy rule shapes from old saves / pre-migration)   */
/* ------------------------------------------------------------------ */

const LEGACY_TRIGGER_RENAMES: Record<string, AutomationTriggerType> = {
  "stage-enter": "deal-stage-enter",
  "ticket-opened": "ticket-created",
};

/** Accepts any historical rule shape and returns the current one. */
export function normalizeRule(raw: unknown): AutomationRule | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.name !== "string") return null;

  const rawTrigger = (r.trigger ?? {}) as Record<string, unknown>;
  const renamed = LEGACY_TRIGGER_RENAMES[String(rawTrigger.type)];
  const trigger = {
    ...rawTrigger,
    type: renamed ?? (rawTrigger.type as AutomationTriggerType),
  } as AutomationTrigger;
  if (!TRIGGER_META[trigger.type]) return null;

  // Legacy rules had a single `action`; current ones carry `actions`.
  const actions = Array.isArray(r.actions)
    ? (r.actions as AutomationAction[])
    : r.action && typeof r.action === "object"
      ? [r.action as AutomationAction]
      : [];
  if (actions.length === 0) return null;

  return {
    id: r.id,
    name: r.name,
    enabled: r.enabled !== false,
    trigger,
    conditions: Array.isArray(r.conditions)
      ? (r.conditions as AutomationCondition[])
      : [],
    actions,
  };
}

/* ------------------------------------------------------------------ */
/* Matching + interpolation (demo evaluator; mirrors the plpgsql)      */
/* ------------------------------------------------------------------ */

export function ruleMatches(rule: AutomationRule, event: AutomationEvent): boolean {
  if (!rule.enabled) return false;
  const t = rule.trigger;
  if (t.type !== event.type) return false;
  if (t.type === "deal-stage-enter" && t.stageId !== event.payload.stageId) return false;
  if (t.type === "ticket-status" && t.status !== event.payload.status) return false;
  return evaluateConditions(rule.conditions, event.payload);
}

export function evaluateConditions(
  conditions: AutomationCondition[],
  payload: AutomationEventPayload,
): boolean {
  return conditions.every((c) => {
    const actual = payload[c.field];
    if (actual === undefined || actual === null) return false;
    switch (c.op) {
      case "eq":
        return String(actual) === String(c.value);
      case "neq":
        return String(actual) !== String(c.value);
      case "gte":
        return Number(actual) >= Number(c.value);
      case "lte":
        return Number(actual) <= Number(c.value);
    }
  });
}

/** Fill {deal} {company} {contact} {invoice} {amount} from the payload.
 * {deal} falls back to the event's display name — legacy rules relied on it. */
export function interpolate(text: string, p: AutomationEventPayload): string {
  return text
    .replaceAll("{deal}", p.deal ?? p.name ?? "")
    .replaceAll("{company}", p.company ?? "")
    .replaceAll("{contact}", p.contact ?? "")
    .replaceAll("{invoice}", p.invoice ?? "")
    .replaceAll("{amount}", p.amount !== undefined ? fmtMoney(p.amount) : "");
}
