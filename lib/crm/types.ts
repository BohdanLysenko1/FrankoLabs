/**
 * Franko CRM — data model.
 *
 * Everything is kept in an in-memory client store for now (see store.tsx).
 * The shapes are deliberately backend-ready: swap the store's reducer for
 * API calls against these same types when a real database lands.
 */

export type StageKind = "open" | "won" | "lost";

export type Stage = {
  id: string;
  name: string;
  kind: StageKind;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  location: string;
  /** True once they've signed — unlocks the client portal. */
  isClient: boolean;
  notes: string;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyId: string | null;
  /** Hue (0-360) for the generated avatar. */
  hue: number;
  tags: string[];
  createdAt: number;
  notes: string;
};

export type Deal = {
  id: string;
  name: string;
  companyId: string | null;
  contactId: string | null;
  stageId: string;
  /** USD. */
  value: number;
  source: string;
  createdAt: number;
  /** When the deal last changed stage — Pulse uses this to detect stalls. */
  stageChangedAt: number;
  closedAt: number | null;
};

export type Task = {
  id: string;
  title: string;
  dueAt: number;
  done: boolean;
  dealId: string | null;
  contactId: string | null;
  createdAt: number;
};

export type ActivityType =
  | "note"
  | "email"
  | "call"
  | "meeting"
  | "stage"
  | "system";

export type Activity = {
  id: string;
  type: ActivityType;
  summary: string;
  at: number;
  dealId: string | null;
  contactId: string | null;
  companyId: string | null;
  /** Shared into the client portal update feed. */
  clientVisible: boolean;
};

export type EventKind = "call" | "meeting" | "deadline" | "other";

export type CalEvent = {
  id: string;
  title: string;
  kind: EventKind;
  startAt: number;
  durationMin: number;
  dealId: string | null;
  contactId: string | null;
  notes: string;
  /** Completing a call/meeting logs an activity — a Pulse touch. */
  done: boolean;
};

export type AutomationTrigger =
  | { type: "deal-created" }
  | { type: "stage-enter"; stageId: string }
  | { type: "deal-won" };

export type AutomationAction =
  | { type: "create-task"; title: string; offsetDays: number }
  | { type: "portal-update"; text: string }
  | { type: "create-event"; title: string; offsetDays: number; kind: EventKind };

/** "{deal}" in task titles / update text expands to the deal name at run time. */
export type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
};

/** Cross-page UI requests (e.g. command palette opening a record's drawer). */
export type OpenRequest = {
  kind:
    | "contact"
    | "company"
    | "deal"
    | "new-deal"
    | "new-contact"
    | "new-task"
    | "new-event";
  id?: string;
};

export type TeamRole = "Owner" | "Admin" | "Member";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  hue: number;
};

export type PlanId = "solo" | "studio" | "scale";

export type Workspace = {
  name: string;
  plan: PlanId;
};

export type CrmState = {
  workspace: Workspace;
  stages: Stage[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
  events: CalEvent[];
  rules: AutomationRule[];
  team: TeamMember[];
  /** Notification ids the user has dismissed. */
  readNotifIds: string[];
  /** Set after the onboarding wizard finishes. Persisted with the rest. */
  onboarded: boolean;
  /** Transient cross-page UI state — never persisted. */
  ui: { openRequest: OpenRequest | null };
};

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const DAY = 86_400_000;

export function fmtMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtDate(at: number): string {
  return new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function fmtTime(at: number): string {
  return new Date(at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysAgo(at: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - at) / DAY));
}

export function relTime(at: number, now: number = Date.now()): string {
  const diff = now - at;
  if (diff < 0) {
    const d = Math.ceil(-diff / DAY);
    return d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d}d`;
  }
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
