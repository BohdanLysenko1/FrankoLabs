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
  | { type: "deal-won" }
  | { type: "contract-signed" }
  | { type: "ticket-opened" }
  | { type: "invoice-paid" };

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
    | "doc"
    | "new-deal"
    | "new-contact"
    | "new-task"
    | "new-event"
    | "new-proposal";
  id?: string;
};

const OPEN_REQUEST_KEY = "franko-crm-open-request";

/**
 * Cross-layout handoff: the site's command palette stashes a request here
 * before navigating into /crm, and the CRM shell consumes it on mount —
 * the two layouts run separate store instances, so ui state can't carry over.
 */
export function stashOpenRequest(request: OpenRequest) {
  try {
    sessionStorage.setItem(OPEN_REQUEST_KEY, JSON.stringify(request));
  } catch {
    // Storage unavailable — navigation still lands on the right page.
  }
}

export function takeOpenRequest(): OpenRequest | null {
  try {
    const raw = sessionStorage.getItem(OPEN_REQUEST_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(OPEN_REQUEST_KEY);
    return JSON.parse(raw) as OpenRequest;
  } catch {
    return null;
  }
}

export type InvoiceStatus = "due" | "paid";

export type Invoice = {
  id: string;
  /** Human-facing number, e.g. "INV-1042". */
  number: string;
  companyId: string;
  dealId: string | null;
  label: string;
  /** USD. */
  amount: number;
  issuedAt: number;
  dueAt: number;
  paidAt: number | null;
  status: InvoiceStatus;
};

export type ContractStatus = "sent" | "viewed" | "signed";

export type Contract = {
  id: string;
  companyId: string;
  dealId: string | null;
  title: string;
  summary: string;
  /** USD. */
  amount: number;
  /** Bullet terms shown in the signing view. */
  terms: string[];
  status: ContractStatus;
  sentAt: number;
  viewedAt: number | null;
  signedAt: number | null;
  signedBy: string | null;
};

export type TicketStatus = "open" | "in_progress" | "resolved";

export type TicketMessage = {
  id: string;
  from: "client" | "agency";
  author: string;
  text: string;
  at: number;
};

export type Ticket = {
  id: string;
  companyId: string;
  contactId: string | null;
  topic: string;
  subject: string;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  messages: TicketMessage[];
};

export type DeliverableKind = "design" | "staging" | "file" | "doc";

export type DeliverableStatus = "in_review" | "approved" | "changes_requested";

/** Work posted for client review — approved from the portal's Projects tool. */
export type Deliverable = {
  id: string;
  dealId: string | null;
  companyId: string;
  title: string;
  kind: DeliverableKind;
  /** Where the client looks: Figma link, staging URL, file, document. */
  url: string;
  note: string;
  status: DeliverableStatus;
  postedAt: number;
  respondedAt: number | null;
  clientComment: string;
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
  invoices: Invoice[];
  contracts: Contract[];
  tickets: Ticket[];
  deliverables: Deliverable[];
  /**
   * Portal tool ids enabled per client company — what each client bought.
   * Kept as plain strings so the CRM core doesn't depend on the portal's
   * tool registry; lib/portal/portal.ts interprets them.
   */
  entitlements: Record<string, string[]>;
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
