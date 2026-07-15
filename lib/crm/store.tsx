"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { makeSeedState, makeSeedDocs, AGENCY_STAGES, SIMPLE_STAGES, DEMO_VAULT_SECRETS } from "./seed";
import {
  uid,
  DAY,
  nextBillingDate,
  type Activity,
  type ActivityType,
  type AutomationRule,
  type AutomationTrigger,
  type CalEvent,
  type Company,
  type Contact,
  type Contract,
  type CrmState,
  type Deal,
  type Deliverable,
  type DeliverableKind,
  type DocArticle,
  type EmailMessage,
  type EmailThread,
  type Invoice,
  type Lead,
  type OpenRequest,
  type PlanId,
  type Retainer,
  type Stage,
  type Task,
  type TeamRole,
  type Ticket,
  type TicketAttachment,
  type TicketMessage,
  type TicketStatus,
  type TimeEntry,
  type VaultCategory,
  type VaultEntry,
} from "./types";
import type { Proposal } from "@/lib/proposals";
import { createClient } from "@/lib/supabase/client";
import { useSession, type Session } from "@/lib/supabase/session";
import {
  applyChange,
  ensureClientInfra,
  importWorkspaceData,
  loadWorkspaceState,
  mapClientUsers,
  mapTeam,
  REALTIME_TABLES,
  type Db,
} from "./db";
import { inviteClientUser, inviteTeamMemberUser } from "@/lib/actions/invites";

/**
 * The CRM store runs one of two engines behind the same interface:
 *
 *  - Demo engine — the original client-side reducer, used when nobody is
 *    signed in (marketing previews, ?noonboard test sessions). Persists to
 *    localStorage except in ephemeral sessions.
 *  - Database engine — Supabase is the source of truth. Actions write through
 *    (multi-step operations via Postgres RPCs so automations and invoice
 *    numbering stay atomic), a realtime channel keeps every open client in
 *    sync, and local dispatches keep the UI optimistic.
 */

const STORAGE_KEY = "franko-crm-state-v2";

/** ?noonboard=1 boots a fresh sample workspace and never writes to storage —
 * used by tests/screenshots so they can't clobber real data. */
function isEphemeralSession(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("noonboard")
  );
}

type Action =
  | { type: "complete-onboarding"; workspaceName: string; template: "agency" | "simple"; withSampleData: boolean }
  | { type: "reset-demo" }
  | { type: "import-state"; state: Partial<CrmState> }
  | { type: "set-workspace-name"; name: string }
  | { type: "set-plan"; plan: PlanId }
  | { type: "add-contact"; contact: Contact }
  | { type: "update-contact"; id: string; patch: Partial<Contact> }
  | { type: "delete-contact"; id: string }
  | { type: "add-leads"; leads: Lead[] }
  | { type: "update-leads"; ids: string[]; patch: Partial<Lead> }
  | { type: "delete-leads"; ids: string[] }
  | { type: "add-company"; company: Company }
  | { type: "update-company"; id: string; patch: Partial<Company> }
  | { type: "delete-company"; id: string }
  | { type: "add-deal"; deal: Deal }
  | { type: "update-deal"; id: string; patch: Partial<Deal> }
  | { type: "move-deal"; id: string; stageId: string; at: number }
  | { type: "delete-deal"; id: string }
  | { type: "add-task"; task: Task }
  | { type: "update-task"; id: string; patch: Partial<Task> }
  | { type: "toggle-task"; id: string }
  | { type: "delete-task"; id: string }
  | { type: "add-event"; event: CalEvent }
  | { type: "update-event"; id: string; patch: Partial<CalEvent> }
  | { type: "delete-event"; id: string }
  | { type: "log-activity"; activity: Activity }
  | { type: "add-invoice"; invoice: Invoice }
  | { type: "pay-invoice"; id: string; at: number }
  | { type: "save-retainer"; retainer: Retainer }
  | { type: "delete-retainer"; id: string }
  | { type: "add-time-entry"; entry: TimeEntry }
  | { type: "delete-time-entry"; id: string }
  | { type: "add-email-thread"; thread: EmailThread }
  | { type: "email-message"; threadId: string; message: EmailMessage }
  | { type: "mark-thread-read"; id: string }
  | { type: "delete-email-thread"; id: string }
  | { type: "set-inbound-address"; address: string }
  | { type: "add-contract"; contract: Contract }
  | { type: "update-contract"; id: string; patch: Partial<Contract> }
  | { type: "add-ticket"; ticket: Ticket }
  | { type: "ticket-message"; ticketId: string; message: TicketMessage; status?: TicketStatus }
  | { type: "set-ticket-status"; id: string; status: TicketStatus }
  | { type: "set-entitlements"; companyId: string; toolIds: string[] }
  | { type: "add-deliverable"; deliverable: Deliverable }
  | {
      type: "respond-deliverable";
      id: string;
      status: "approved" | "changes_requested";
      comment: string;
      at: number;
    }
  | { type: "rename-stage"; id: string; name: string }
  | { type: "add-stage"; stage: Stage; beforeClosed: true }
  | { type: "remove-stage"; id: string }
  | { type: "move-stage"; id: string; dir: -1 | 1 }
  | { type: "add-rule"; rule: AutomationRule }
  | { type: "toggle-rule"; id: string }
  | { type: "delete-rule"; id: string }
  | { type: "mark-notifs-read"; ids: string[] }
  | { type: "set-open-request"; request: OpenRequest | null }
  | { type: "add-team-member"; member: CrmState["team"][number] }
  | { type: "remove-team-member"; id: string }
  | { type: "set-team-role"; id: string; role: TeamRole }
  | { type: "save-proposal"; proposal: Proposal }
  | { type: "delete-proposal"; id: string }
  | { type: "save-doc"; article: DocArticle }
  | { type: "delete-doc"; id: string }
  | { type: "save-vault"; entry: VaultEntry }
  | { type: "delete-vault"; id: string };

function emptyState(base: CrmState): CrmState {
  return {
    ...base,
    companies: [],
    contacts: [],
    leads: [],
    deals: [],
    tasks: [],
    activities: [],
    events: [],
    invoices: [],
    retainers: [],
    timeEntries: [],
    emailThreads: [],
    contracts: [],
    tickets: [],
    deliverables: [],
    entitlements: {},
    sites: {},
    analytics: {},
    vault: [],
    proposals: [],
    clientUsers: [],
  };
}

function reducer(state: CrmState, action: Action): CrmState {
  switch (action.type) {
    case "complete-onboarding": {
      const seeded = makeSeedState();
      const stages =
        action.template === "simple" ? SIMPLE_STAGES : AGENCY_STAGES;
      const next = action.withSampleData ? seeded : emptyState(seeded);
      return {
        ...next,
        stages: action.withSampleData ? seeded.stages : stages,
        workspace: { ...next.workspace, name: action.workspaceName || "My workspace" },
        onboarded: true,
      };
    }
    case "reset-demo": {
      return { ...makeSeedState(), onboarded: true };
    }
    case "import-state": {
      // Spread over a fresh seed so fields added after the backup was taken
      // get defaults, mirroring how initState restores from localStorage.
      return {
        ...makeSeedState(),
        ...action.state,
        ui: { openRequest: null },
        onboarded: true,
      };
    }
    case "set-workspace-name":
      return { ...state, workspace: { ...state.workspace, name: action.name } };
    case "set-plan":
      return { ...state, workspace: { ...state.workspace, plan: action.plan } };
    case "add-contact":
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case "update-contact":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "delete-contact":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
        deals: state.deals.map((d) =>
          d.contactId === action.id ? { ...d, contactId: null } : d,
        ),
        tasks: state.tasks.map((t) =>
          t.contactId === action.id ? { ...t, contactId: null } : t,
        ),
        events: state.events.map((e) =>
          e.contactId === action.id ? { ...e, contactId: null } : e,
        ),
      };
    case "add-leads":
      return { ...state, leads: [...action.leads, ...state.leads] };
    case "update-leads": {
      const ids = new Set(action.ids);
      return {
        ...state,
        leads: state.leads.map((l) =>
          ids.has(l.id) ? { ...l, ...action.patch } : l,
        ),
      };
    }
    case "delete-leads": {
      const ids = new Set(action.ids);
      return { ...state, leads: state.leads.filter((l) => !ids.has(l.id)) };
    }
    case "add-company":
      return { ...state, companies: [action.company, ...state.companies] };
    case "update-company":
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "delete-company": {
      const sites = { ...state.sites };
      delete sites[action.id];
      const analytics = { ...state.analytics };
      delete analytics[action.id];
      const entitlements = { ...state.entitlements };
      delete entitlements[action.id];
      return {
        ...state,
        companies: state.companies.filter((c) => c.id !== action.id),
        contacts: state.contacts.map((c) =>
          c.companyId === action.id ? { ...c, companyId: null } : c,
        ),
        deals: state.deals.map((d) =>
          d.companyId === action.id ? { ...d, companyId: null } : d,
        ),
        vault: state.vault.filter((v) => v.companyId !== action.id),
        clientUsers: state.clientUsers.filter((u) => u.companyId !== action.id),
        sites,
        analytics,
        entitlements,
      };
    }
    case "add-deal":
      return { ...state, deals: [action.deal, ...state.deals] };
    case "update-deal":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d,
        ),
      };
    case "move-deal": {
      const stage = state.stages.find((s) => s.id === action.stageId);
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id
            ? {
                ...d,
                stageId: action.stageId,
                stageChangedAt: action.at,
                closedAt: stage && stage.kind !== "open" ? action.at : null,
              }
            : d,
        ),
      };
    }
    case "delete-deal":
      return {
        ...state,
        deals: state.deals.filter((d) => d.id !== action.id),
        tasks: state.tasks.map((t) =>
          t.dealId === action.id ? { ...t, dealId: null } : t,
        ),
        events: state.events.map((e) =>
          e.dealId === action.id ? { ...e, dealId: null } : e,
        ),
      };
    case "add-task":
      return { ...state, tasks: [action.task, ...state.tasks] };
    case "update-task":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.patch } : t,
        ),
      };
    case "toggle-task":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };
    case "delete-task":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "add-event":
      return { ...state, events: [action.event, ...state.events] };
    case "update-event":
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };
    case "delete-event":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.id),
      };
    case "log-activity":
      return { ...state, activities: [action.activity, ...state.activities] };
    case "add-invoice":
      return { ...state, invoices: [action.invoice, ...state.invoices] };
    case "pay-invoice":
      return {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id && i.status === "due"
            ? { ...i, status: "paid", paidAt: action.at }
            : i,
        ),
      };
    case "save-retainer": {
      const exists = state.retainers.some((r) => r.id === action.retainer.id);
      return {
        ...state,
        retainers: exists
          ? state.retainers.map((r) =>
              r.id === action.retainer.id ? action.retainer : r,
            )
          : [action.retainer, ...state.retainers],
      };
    }
    case "delete-retainer":
      return {
        ...state,
        retainers: state.retainers.filter((r) => r.id !== action.id),
        timeEntries: state.timeEntries.map((t) =>
          t.retainerId === action.id ? { ...t, retainerId: null } : t,
        ),
      };
    case "add-time-entry":
      return { ...state, timeEntries: [action.entry, ...state.timeEntries] };
    case "delete-time-entry":
      return {
        ...state,
        timeEntries: state.timeEntries.filter((t) => t.id !== action.id),
      };
    case "add-email-thread":
      return { ...state, emailThreads: [action.thread, ...state.emailThreads] };
    case "email-message":
      return {
        ...state,
        emailThreads: state.emailThreads
          .map((t) =>
            t.id === action.threadId
              ? {
                  ...t,
                  messages: [...t.messages, action.message],
                  lastMessageAt: action.message.at,
                  lastDirection: action.message.direction,
                  snippet: action.message.bodyText.slice(0, 140),
                  unread: action.message.direction === "in",
                }
              : t,
          )
          .sort((a, b) => b.lastMessageAt - a.lastMessageAt),
      };
    case "mark-thread-read":
      return {
        ...state,
        emailThreads: state.emailThreads.map((t) =>
          t.id === action.id ? { ...t, unread: false } : t,
        ),
      };
    case "delete-email-thread":
      return {
        ...state,
        emailThreads: state.emailThreads.filter((t) => t.id !== action.id),
      };
    case "set-inbound-address":
      return {
        ...state,
        workspace: { ...state.workspace, inboundAddress: action.address },
      };
    case "add-contract":
      return { ...state, contracts: [action.contract, ...state.contracts] };
    case "update-contract":
      return {
        ...state,
        contracts: state.contracts.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "add-ticket":
      return { ...state, tickets: [action.ticket, ...state.tickets] };
    case "ticket-message":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.ticketId
            ? {
                ...t,
                messages: [...t.messages, action.message],
                status: action.status ?? t.status,
                updatedAt: action.message.at,
              }
            : t,
        ),
      };
    case "set-ticket-status":
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.id
            ? { ...t, status: action.status, updatedAt: Date.now() }
            : t,
        ),
      };
    case "set-entitlements":
      return {
        ...state,
        entitlements: {
          ...state.entitlements,
          [action.companyId]: action.toolIds,
        },
      };
    case "add-deliverable":
      return {
        ...state,
        deliverables: [action.deliverable, ...state.deliverables],
      };
    case "respond-deliverable":
      return {
        ...state,
        deliverables: state.deliverables.map((d) =>
          d.id === action.id
            ? {
                ...d,
                status: action.status,
                clientComment: action.comment,
                respondedAt: action.at,
              }
            : d,
        ),
      };
    case "rename-stage":
      return {
        ...state,
        stages: state.stages.map((s) =>
          s.id === action.id ? { ...s, name: action.name } : s,
        ),
      };
    case "add-stage": {
      // New stages slot in before the won/lost columns.
      const open = state.stages.filter((s) => s.kind === "open");
      const closed = state.stages.filter((s) => s.kind !== "open");
      return { ...state, stages: [...open, action.stage, ...closed] };
    }
    case "remove-stage": {
      const open = state.stages.filter((s) => s.kind === "open");
      if (open.length <= 1) return state;
      const fallback = open.find((s) => s.id !== action.id);
      if (!fallback) return state;
      return {
        ...state,
        stages: state.stages.filter((s) => s.id !== action.id),
        deals: state.deals.map((d) =>
          d.stageId === action.id ? { ...d, stageId: fallback.id } : d,
        ),
      };
    }
    case "move-stage": {
      const open = state.stages.filter((s) => s.kind === "open");
      const closed = state.stages.filter((s) => s.kind !== "open");
      const idx = open.findIndex((s) => s.id === action.id);
      const to = idx + action.dir;
      if (idx === -1 || to < 0 || to >= open.length) return state;
      const next = [...open];
      [next[idx], next[to]] = [next[to], next[idx]];
      return { ...state, stages: [...next, ...closed] };
    }
    case "add-rule":
      return { ...state, rules: [...state.rules, action.rule] };
    case "toggle-rule":
      return {
        ...state,
        rules: state.rules.map((r) =>
          r.id === action.id ? { ...r, enabled: !r.enabled } : r,
        ),
      };
    case "delete-rule":
      return { ...state, rules: state.rules.filter((r) => r.id !== action.id) };
    case "mark-notifs-read": {
      const merged = new Set([...state.readNotifIds, ...action.ids]);
      return { ...state, readNotifIds: [...merged].slice(-400) };
    }
    case "set-open-request":
      return { ...state, ui: { openRequest: action.request } };
    case "add-team-member":
      return { ...state, team: [...state.team, action.member] };
    case "remove-team-member":
      return { ...state, team: state.team.filter((m) => m.id !== action.id) };
    case "set-team-role":
      return {
        ...state,
        team: state.team.map((m) =>
          // Owner rows never change here; ownership transfer is a separate flow.
          m.id === action.id && m.role !== "Owner"
            ? { ...m, role: action.role }
            : m,
        ),
      };
    case "save-proposal": {
      const exists = state.proposals.some((p) => p.id === action.proposal.id);
      return {
        ...state,
        proposals: exists
          ? state.proposals.map((p) =>
              p.id === action.proposal.id ? action.proposal : p,
            )
          : [action.proposal, ...state.proposals],
      };
    }
    case "delete-proposal":
      return {
        ...state,
        proposals: state.proposals.filter((p) => p.id !== action.id),
      };
    case "save-doc": {
      const exists = state.docs.some((d) => d.id === action.article.id);
      const docs = exists
        ? state.docs.map((d) => (d.id === action.article.id ? action.article : d))
        : [...state.docs, action.article];
      return { ...state, docs: docs.sort((a, b) => a.position - b.position) };
    }
    case "delete-doc":
      return { ...state, docs: state.docs.filter((d) => d.id !== action.id) };
    case "save-vault": {
      const exists = state.vault.some((v) => v.id === action.entry.id);
      const vault = exists
        ? state.vault.map((v) => (v.id === action.entry.id ? action.entry : v))
        : [...state.vault, action.entry];
      return {
        ...state,
        vault: vault.sort((a, b) => a.name.localeCompare(b.name)),
      };
    }
    case "delete-vault":
      return { ...state, vault: state.vault.filter((v) => v.id !== action.id) };
    default:
      return state;
  }
}

function initState(): CrmState {
  const seeded = makeSeedState();
  if (typeof window === "undefined") return seeded;
  if (isEphemeralSession()) return { ...seeded, onboarded: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<CrmState>;
      if (saved && Array.isArray(saved.stages) && Array.isArray(saved.deals)) {
        // Spread over the seed so fields added in newer versions get defaults.
        return { ...seeded, ...saved, ui: { openRequest: null } };
      }
    }
  } catch {
    // Corrupt save — fall through to a fresh workspace.
  }
  return seeded;
}

/** Continue the visible invoice numbering from the highest number on record. */
function nextInvoiceNumber(invoices: Invoice[]): string {
  const top = invoices.reduce((max, i) => {
    const n = Number(i.number.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 1041);
  return `INV-${top + 1}`;
}

export type LogActivityInput = {
  type: ActivityType;
  summary: string;
  dealId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  clientVisible?: boolean;
};

export type InviteResult = { ok: boolean; error?: string };

export type NewLeadInput = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  website?: string;
  source?: string;
  tags?: string[];
  notes?: string;
};

/**
 * Materialize import rows into Leads, skipping blanks and emails already on
 * the list — bulk pastes routinely overlap earlier imports. createdAt steps
 * down per row so newest-first views keep the file's order.
 */
function buildNewLeads(inputs: NewLeadInput[], existing: Lead[]): Lead[] {
  const seen = new Set(
    existing.filter((l) => l.email).map((l) => l.email.toLowerCase()),
  );
  const now = Date.now();
  const out: Lead[] = [];
  for (const input of inputs) {
    const name = input.name?.trim() ?? "";
    const email = input.email?.trim() ?? "";
    if (!name && !email) continue;
    if (email && seen.has(email.toLowerCase())) continue;
    if (email) seen.add(email.toLowerCase());
    out.push({
      id: uid(),
      name,
      email,
      phone: input.phone?.trim() ?? "",
      role: input.role?.trim() ?? "",
      company: input.company?.trim() ?? "",
      website: input.website?.trim() ?? "",
      source: input.source?.trim() ?? "",
      status: "new",
      tags: input.tags ?? [],
      notes: input.notes?.trim() ?? "",
      lastContactedAt: null,
      convertedContactId: null,
      createdAt: now - out.length,
    });
  }
  return out;
}

/** Partial Lead -> snake_case row patch for the db engine's updates. */
function leadPatchRow(patch: Partial<Lead>) {
  return {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.email !== undefined && { email: patch.email }),
    ...(patch.phone !== undefined && { phone: patch.phone }),
    ...(patch.role !== undefined && { role: patch.role }),
    ...(patch.company !== undefined && { company: patch.company }),
    ...(patch.website !== undefined && { website: patch.website }),
    ...(patch.source !== undefined && { source: patch.source }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.tags !== undefined && { tags: patch.tags }),
    ...(patch.notes !== undefined && { notes: patch.notes }),
    ...(patch.lastContactedAt !== undefined && {
      last_contacted_at:
        patch.lastContactedAt === null
          ? null
          : new Date(patch.lastContactedAt).toISOString(),
    }),
    ...(patch.convertedContactId !== undefined && {
      converted_contact_id: patch.convertedContactId,
    }),
  };
}

/** What converting a lead creates: reuse a company by name or add a shell. */
function conversionPlan(lead: Lead, companies: Company[]) {
  const label = lead.company.trim();
  const existing = label
    ? companies.find((c) => c.name.toLowerCase() === label.toLowerCase())
    : undefined;
  const newCompany: Company | null =
    label && !existing
      ? {
          id: uid(),
          name: label,
          domain: lead.website.trim(),
          industry: "",
          location: "",
          isClient: false,
          notes: "",
        }
      : null;
  const contact: Contact = {
    id: uid(),
    name: lead.name || lead.email,
    email: lead.email,
    phone: lead.phone,
    role: lead.role,
    companyId: existing?.id ?? newCompany?.id ?? null,
    hue: Math.floor(Math.random() * 360),
    tags: lead.tags.includes("lead") ? lead.tags : [...lead.tags, "lead"],
    createdAt: Date.now(),
    notes: lead.notes,
  };
  return { newCompany, contact };
}

/** In-memory plaintext for demo vault items created this session. */
const demoSecrets = new Map<string, string>(Object.entries(DEMO_VAULT_SECRETS));

function buildDemoActions(dispatch: React.Dispatch<Action>, state: CrmState) {
  const logActivity = (input: LogActivityInput) =>
    dispatch({
      type: "log-activity",
      activity: {
        id: uid(),
        type: input.type,
        summary: input.summary,
        at: Date.now(),
        dealId: input.dealId ?? null,
        contactId: input.contactId ?? null,
        companyId: input.companyId ?? null,
        clientVisible: input.clientVisible ?? false,
      },
    });

  /**
   * Fire enabled automation rules matching a trigger. The context names the
   * record that fired ({deal} in templates) and links created work back to
   * it — deals, contracts, tickets and invoices all pass through here.
   */
  type AutomationContext = {
    name: string;
    dealId?: string | null;
    contactId?: string | null;
    companyId?: string | null;
  };
  const runAutomations = (
    kinds: AutomationTrigger["type"][],
    ctx: AutomationContext,
    stageId?: string,
  ) => {
    for (const rule of state.rules) {
      if (!rule.enabled) continue;
      const t = rule.trigger;
      const hit =
        t.type === "stage-enter"
          ? kinds.includes("stage-enter") && t.stageId === stageId
          : kinds.includes(t.type);
      if (!hit) continue;

      const fill = (s: string) => s.replaceAll("{deal}", ctx.name);
      if (rule.action.type === "create-task") {
        dispatch({
          type: "add-task",
          task: {
            id: uid(),
            title: fill(rule.action.title),
            dueAt: Date.now() + rule.action.offsetDays * DAY,
            done: false,
            dealId: ctx.dealId ?? null,
            contactId: ctx.contactId ?? null,
            createdAt: Date.now(),
          },
        });
      } else if (rule.action.type === "portal-update") {
        logActivity({
          type: "note",
          summary: fill(rule.action.text),
          dealId: ctx.dealId,
          contactId: ctx.contactId,
          companyId: ctx.companyId,
          clientVisible: true,
        });
      } else if (rule.action.type === "create-event") {
        dispatch({
          type: "add-event",
          event: {
            id: uid(),
            title: fill(rule.action.title),
            kind: rule.action.kind,
            startAt: Date.now() + rule.action.offsetDays * DAY,
            durationMin: 30,
            dealId: ctx.dealId ?? null,
            contactId: ctx.contactId ?? null,
            notes: "",
            done: false,
          },
        });
      }
      logActivity({
        type: "system",
        summary: `Automation ran: ${rule.name}.`,
        dealId: ctx.dealId,
        companyId: ctx.companyId,
      });
    }
  };

  const dealCtx = (deal: Deal): AutomationContext => ({
    name: deal.name,
    dealId: deal.id,
    contactId: deal.contactId,
    companyId: deal.companyId,
  });

  return {
    completeOnboarding: async (
      workspaceName: string,
      template: "agency" | "simple",
      withSampleData: boolean,
    ): Promise<void> => {
      dispatch({
        type: "complete-onboarding",
        workspaceName,
        template,
        withSampleData,
      });
    },
    resetDemo: () => dispatch({ type: "reset-demo" }),
    importState: async (state: Partial<CrmState>): Promise<void> => {
      dispatch({ type: "import-state", state });
    },
    refresh: () => {},
    setWorkspaceName: (name: string) =>
      dispatch({ type: "set-workspace-name", name }),
    setPlan: (plan: PlanId) => dispatch({ type: "set-plan", plan }),

    addContact: (input: Omit<Contact, "id" | "createdAt" | "hue">) => {
      const contact: Contact = {
        ...input,
        id: uid(),
        createdAt: Date.now(),
        hue: Math.floor(Math.random() * 360),
      };
      dispatch({ type: "add-contact", contact });
      return contact;
    },
    updateContact: (id: string, patch: Partial<Contact>) =>
      dispatch({ type: "update-contact", id, patch }),
    deleteContact: (id: string) => dispatch({ type: "delete-contact", id }),

    addLeads: (inputs: NewLeadInput[]) => {
      const leads = buildNewLeads(inputs, state.leads);
      if (leads.length > 0) dispatch({ type: "add-leads", leads });
      return leads;
    },
    updateLead: (id: string, patch: Partial<Lead>) =>
      dispatch({ type: "update-leads", ids: [id], patch }),
    updateLeads: (ids: string[], patch: Partial<Lead>) =>
      dispatch({ type: "update-leads", ids, patch }),
    deleteLeads: (ids: string[]) => dispatch({ type: "delete-leads", ids }),
    /** Graduate a lead into a real contact (and company, if new). */
    convertLead: (id: string) => {
      const lead = state.leads.find((l) => l.id === id);
      if (!lead || lead.status === "converted") return null;
      const { newCompany, contact } = conversionPlan(lead, state.companies);
      if (newCompany) dispatch({ type: "add-company", company: newCompany });
      dispatch({ type: "add-contact", contact });
      dispatch({
        type: "update-leads",
        ids: [id],
        patch: { status: "converted", convertedContactId: contact.id },
      });
      logActivity({
        type: "system",
        summary: `Lead converted to contact: ${contact.name}${lead.company ? ` (${lead.company})` : ""}.`,
        contactId: contact.id,
        companyId: contact.companyId,
      });
      return contact;
    },

    addCompany: (input: Omit<Company, "id">) => {
      const company: Company = { ...input, id: uid() };
      dispatch({ type: "add-company", company });
      return company;
    },
    updateCompany: (id: string, patch: Partial<Company>) =>
      dispatch({ type: "update-company", id, patch }),
    deleteCompany: (id: string) => dispatch({ type: "delete-company", id }),

    addDeal: (
      input: Omit<Deal, "id" | "createdAt" | "stageChangedAt" | "closedAt">,
    ) => {
      const now = Date.now();
      const deal: Deal = {
        ...input,
        id: uid(),
        createdAt: now,
        stageChangedAt: now,
        closedAt: null,
      };
      dispatch({ type: "add-deal", deal });
      runAutomations(["deal-created"], dealCtx(deal), deal.stageId);
      return deal;
    },
    updateDeal: (id: string, patch: Partial<Deal>) =>
      dispatch({ type: "update-deal", id, patch }),
    moveDeal: (id: string, stageId: string) => {
      const deal = state.deals.find((d) => d.id === id);
      const stage = state.stages.find((s) => s.id === stageId);
      if (!deal || !stage || deal.stageId === stageId) return;
      dispatch({ type: "move-deal", id, stageId, at: Date.now() });
      logActivity({
        type: "stage",
        summary: `Moved to ${stage.name}.`,
        dealId: id,
        contactId: deal.contactId,
        companyId: deal.companyId,
      });
      runAutomations(
        stage.kind === "won" ? ["stage-enter", "deal-won"] : ["stage-enter"],
        dealCtx(deal),
        stageId,
      );
    },
    deleteDeal: (id: string) => dispatch({ type: "delete-deal", id }),

    addTask: (
      title: string,
      dueAt: number,
      link: { dealId?: string | null; contactId?: string | null } = {},
    ) =>
      dispatch({
        type: "add-task",
        task: {
          id: uid(),
          title,
          dueAt,
          done: false,
          dealId: link.dealId ?? null,
          contactId: link.contactId ?? null,
          createdAt: Date.now(),
        },
      }),
    updateTask: (id: string, patch: Partial<Pick<Task, "title" | "dueAt">>) =>
      dispatch({ type: "update-task", id, patch }),
    toggleTask: (id: string) => dispatch({ type: "toggle-task", id }),
    deleteTask: (id: string) => dispatch({ type: "delete-task", id }),

    addEvent: (input: Omit<CalEvent, "id" | "done">) => {
      const event: CalEvent = { ...input, id: uid(), done: false };
      dispatch({ type: "add-event", event });
      return event;
    },
    updateEvent: (id: string, patch: Partial<CalEvent>) =>
      dispatch({ type: "update-event", id, patch }),
    deleteEvent: (id: string) => dispatch({ type: "delete-event", id }),
    /** Mark a call/meeting done and log it as a Pulse touch. */
    completeEvent: (id: string) => {
      const event = state.events.find((e) => e.id === id);
      if (!event || event.done) return;
      dispatch({ type: "update-event", id, patch: { done: true } });
      if (event.kind === "call" || event.kind === "meeting") {
        const deal = event.dealId
          ? state.deals.find((d) => d.id === event.dealId)
          : null;
        logActivity({
          type: event.kind === "call" ? "call" : "meeting",
          summary: `${event.title} — completed.`,
          dealId: event.dealId,
          contactId: event.contactId,
          companyId: deal?.companyId ?? null,
        });
      }
    },

    logActivity,

    addInvoice: (input: {
      companyId: string;
      dealId?: string | null;
      label: string;
      amount: number;
      dueInDays?: number;
    }) => {
      const now = Date.now();
      const invoice: Invoice = {
        id: uid(),
        number: nextInvoiceNumber(state.invoices),
        companyId: input.companyId,
        dealId: input.dealId ?? null,
        label: input.label,
        amount: input.amount,
        issuedAt: now,
        dueAt: now + (input.dueInDays ?? 14) * DAY,
        paidAt: null,
        status: "due",
      };
      dispatch({ type: "add-invoice", invoice });
      logActivity({
        type: "system",
        summary: `Invoice ${invoice.number} issued — ${invoice.label}.`,
        dealId: invoice.dealId,
        companyId: invoice.companyId,
        clientVisible: true,
      });
      return invoice;
    },
    /** Demo reminder — no real email engine, so it only logs the touch. */
    sendInvoiceReminder: (id: string) => {
      const invoice = state.invoices.find((i) => i.id === id);
      if (!invoice || invoice.status !== "due") return;
      logActivity({
        type: "email",
        summary: `Payment reminder sent for ${invoice.number} — ${invoice.label}.`,
        dealId: invoice.dealId,
        companyId: invoice.companyId,
        clientVisible: true,
      });
    },
    /** Demo payment — flips a due invoice to paid and tells both sides. */
    payInvoice: (id: string) => {
      const invoice = state.invoices.find((i) => i.id === id);
      if (!invoice || invoice.status !== "due") return;
      dispatch({ type: "pay-invoice", id, at: Date.now() });
      logActivity({
        type: "system",
        summary: `Invoice ${invoice.number} paid — ${invoice.label}.`,
        dealId: invoice.dealId,
        companyId: invoice.companyId,
        clientVisible: true,
      });
      runAutomations(["invoice-paid"], {
        name: invoice.label,
        dealId: invoice.dealId,
        companyId: invoice.companyId,
      });
    },

    /** Create or edit a retainer. Scheduling follows active + autoInvoice. */
    saveRetainer: (input: {
      id?: string;
      companyId: string;
      name: string;
      amount: number;
      includedHours: number;
      billingDay: number;
      active?: boolean;
      autoInvoice?: boolean;
      notes?: string;
    }) => {
      const existing = input.id
        ? state.retainers.find((r) => r.id === input.id)
        : undefined;
      const active = input.active ?? existing?.active ?? true;
      const autoInvoice = input.autoInvoice ?? existing?.autoInvoice ?? true;
      const retainer: Retainer = {
        id: input.id ?? uid(),
        companyId: input.companyId,
        name: input.name,
        amount: input.amount,
        includedHours: input.includedHours,
        billingDay: input.billingDay,
        active,
        autoInvoice,
        // Keep an existing schedule when the billing day didn't change.
        nextInvoiceOn: !active || !autoInvoice
          ? null
          : existing?.billingDay === input.billingDay && existing.nextInvoiceOn
            ? existing.nextInvoiceOn
            : nextBillingDate(input.billingDay),
        notes: input.notes?.trim() ?? existing?.notes ?? "",
        createdAt: existing?.createdAt ?? Date.now(),
      };
      dispatch({ type: "save-retainer", retainer });
      return retainer;
    },
    deleteRetainer: (id: string) => dispatch({ type: "delete-retainer", id }),
    /** Generate this period's invoice now and advance the schedule. */
    billRetainer: (id: string) => {
      const retainer = state.retainers.find((r) => r.id === id);
      if (!retainer || !retainer.active) return;
      const now = Date.now();
      const period = new Date(
        retainer.nextInvoiceOn ?? now,
      ).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      dispatch({
        type: "add-invoice",
        invoice: {
          id: uid(),
          number: nextInvoiceNumber(state.invoices),
          companyId: retainer.companyId,
          dealId: null,
          label: `${retainer.name} — ${period}`,
          amount: retainer.amount,
          issuedAt: now,
          dueAt: now + 14 * DAY,
          paidAt: null,
          status: "due",
        },
      });
      if (retainer.nextInvoiceOn !== null) {
        const from = new Date(retainer.nextInvoiceOn);
        dispatch({
          type: "save-retainer",
          retainer: {
            ...retainer,
            nextInvoiceOn: new Date(
              from.getFullYear(),
              from.getMonth() + 1,
              retainer.billingDay,
            ).getTime(),
          },
        });
      }
      logActivity({
        type: "system",
        summary: `Retainer invoiced: ${retainer.name}.`,
        companyId: retainer.companyId,
        clientVisible: true,
      });
    },

    logTime: (input: {
      companyId?: string | null;
      retainerId?: string | null;
      taskId?: string | null;
      dealId?: string | null;
      minutes: number;
      note?: string;
      entryDate?: number;
      billable?: boolean;
    }) => {
      const entry: TimeEntry = {
        id: uid(),
        companyId: input.companyId ?? null,
        retainerId: input.retainerId ?? null,
        taskId: input.taskId ?? null,
        dealId: input.dealId ?? null,
        author: state.team[0]?.name ?? "You",
        minutes: Math.round(input.minutes),
        note: input.note?.trim() ?? "",
        entryDate: input.entryDate ?? Date.now(),
        billable: input.billable ?? true,
        createdAt: Date.now(),
      };
      dispatch({ type: "add-time-entry", entry });
      return entry;
    },
    deleteTimeEntry: (id: string) =>
      dispatch({ type: "delete-time-entry", id }),

    /** Compose or reply. Returns the thread id the message landed in. */
    sendEmail: async (input: {
      threadId?: string | null;
      contactId?: string | null;
      leadId?: string | null;
      to: string[];
      subject: string;
      body: string;
    }): Promise<string | null> => {
      const to = input.to.map((t) => t.trim()).filter(Boolean);
      const body = input.body.trim();
      if (to.length === 0 || !body) return null;
      let thread = input.threadId
        ? state.emailThreads.find((t) => t.id === input.threadId)
        : undefined;
      if (!thread) {
        const contact = input.contactId
          ? state.contacts.find((c) => c.id === input.contactId)
          : undefined;
        thread = {
          id: uid(),
          subject: input.subject.trim() || "(no subject)",
          contactId: contact?.id ?? null,
          companyId: contact?.companyId ?? null,
          leadId: input.leadId ?? null,
          lastMessageAt: Date.now(),
          lastDirection: "out",
          snippet: body.slice(0, 140),
          unread: false,
          createdAt: Date.now(),
          messages: [],
        };
        dispatch({ type: "add-email-thread", thread });
      }
      dispatch({
        type: "email-message",
        threadId: thread.id,
        message: {
          id: uid(),
          direction: "out",
          fromEmail: "hello@frankolabs.com",
          fromName: state.team[0]?.name ?? "Franko Labs",
          toEmails: to,
          bodyText: body,
          at: Date.now(),
        },
      });
      logActivity({
        type: "email",
        summary: `Email sent to ${to.join(", ")} — "${thread.subject}".`,
        contactId: thread.contactId,
        companyId: thread.companyId,
      });
      return thread.id;
    },
    markThreadRead: (id: string) => {
      const thread = state.emailThreads.find((t) => t.id === id);
      if (!thread || !thread.unread) return;
      dispatch({ type: "mark-thread-read", id });
    },
    deleteEmailThread: (id: string) =>
      dispatch({ type: "delete-email-thread", id }),
    setInboundAddress: (address: string) =>
      dispatch({ type: "set-inbound-address", address: address.trim() }),

    sendContract: (input: {
      companyId: string;
      dealId?: string | null;
      title: string;
      summary: string;
      amount: number;
      terms?: string[];
    }) => {
      const contract: Contract = {
        id: uid(),
        companyId: input.companyId,
        dealId: input.dealId ?? null,
        title: input.title,
        summary: input.summary,
        amount: input.amount,
        terms: input.terms ?? [
          "50% deposit invoiced on signature, balance on delivery.",
          "Scope changes are quoted before work starts.",
        ],
        status: "sent",
        sentAt: Date.now(),
        viewedAt: null,
        signedAt: null,
        signedBy: null,
      };
      dispatch({ type: "add-contract", contract });
      logActivity({
        type: "system",
        summary: `Contract sent for signature: ${contract.title}.`,
        dealId: contract.dealId,
        companyId: contract.companyId,
        clientVisible: true,
      });
      return contract;
    },
    /** First open in the portal — flips "sent" to "viewed" for the agency. */
    markContractViewed: (id: string) => {
      const contract = state.contracts.find((c) => c.id === id);
      if (!contract || contract.status !== "sent") return;
      dispatch({
        type: "update-contract",
        id,
        patch: { status: "viewed", viewedAt: Date.now() },
      });
    },
    /**
     * "Signed means started": the signature flips the contract, invoices the
     * 50% deposit and drops a kickoff task into the agency's queue.
     */
    signContract: (id: string, signerName: string) => {
      const contract = state.contracts.find((c) => c.id === id);
      if (!contract || contract.status === "signed") return;
      const now = Date.now();
      dispatch({
        type: "update-contract",
        id,
        patch: { status: "signed", signedAt: now, signedBy: signerName },
      });
      dispatch({
        type: "add-invoice",
        invoice: {
          id: uid(),
          number: nextInvoiceNumber(state.invoices),
          companyId: contract.companyId,
          dealId: contract.dealId,
          label: `${contract.title} — 50% deposit`,
          amount: Math.round(contract.amount / 2),
          issuedAt: now,
          dueAt: now + 14 * DAY,
          paidAt: null,
          status: "due",
        },
      });
      dispatch({
        type: "add-task",
        task: {
          id: uid(),
          title: `Kick off: ${contract.title}`,
          dueAt: now + 2 * DAY,
          done: false,
          dealId: contract.dealId,
          contactId: null,
          createdAt: now,
        },
      });
      logActivity({
        type: "system",
        summary: `Contract signed by ${signerName}: ${contract.title}. Deposit invoiced, kickoff scheduled.`,
        dealId: contract.dealId,
        companyId: contract.companyId,
        clientVisible: true,
      });
      runAutomations(["contract-signed"], {
        name: contract.title,
        dealId: contract.dealId,
        companyId: contract.companyId,
      });
    },

    createTicket: (input: {
      companyId: string;
      contactId?: string | null;
      author: string;
      topic: string;
      subject: string;
      details?: string;
      attachments?: TicketAttachment[];
    }) => {
      const now = Date.now();
      const ticket: Ticket = {
        id: uid(),
        companyId: input.companyId,
        contactId: input.contactId ?? null,
        topic: input.topic,
        subject: input.subject,
        status: "open",
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: uid(),
            from: "client",
            author: input.author,
            text: input.details?.trim() || input.subject,
            at: now,
            attachments: input.attachments ?? [],
          },
        ],
      };
      dispatch({ type: "add-ticket", ticket });
      logActivity({
        type: "note",
        summary: `Support request from ${input.author}: ${input.subject}`,
        contactId: ticket.contactId,
        companyId: ticket.companyId,
      });
      runAutomations(["ticket-opened"], {
        name: ticket.subject,
        contactId: ticket.contactId,
        companyId: ticket.companyId,
      });
      return ticket;
    },
    replyTicket: (
      id: string,
      from: "client" | "agency",
      author: string,
      text: string,
      attachments?: TicketAttachment[],
    ) => {
      const ticket = state.tickets.find((t) => t.id === id);
      if (!ticket || (!text.trim() && !attachments?.length)) return;
      dispatch({
        type: "ticket-message",
        ticketId: id,
        message: {
          id: uid(),
          from,
          author,
          text: text.trim(),
          at: Date.now(),
          attachments: attachments ?? [],
        },
        // An agency reply on a fresh ticket implicitly starts work on it.
        status:
          from === "agency" && ticket.status === "open"
            ? "in_progress"
            : undefined,
      });
    },
    setTicketStatus: (id: string, status: TicketStatus) =>
      dispatch({ type: "set-ticket-status", id, status }),

    setEntitlements: (companyId: string, toolIds: string[]) =>
      dispatch({ type: "set-entitlements", companyId, toolIds }),

    /** Post work for client review — shows up in their Projects tool. */
    addDeliverable: (input: {
      companyId: string;
      dealId?: string | null;
      title: string;
      kind: DeliverableKind;
      url: string;
      filePath?: string;
      note?: string;
    }) => {
      const deliverable: Deliverable = {
        id: uid(),
        companyId: input.companyId,
        dealId: input.dealId ?? null,
        title: input.title,
        kind: input.kind,
        url: input.url,
        filePath: input.filePath ?? "",
        note: input.note?.trim() ?? "",
        status: "in_review",
        postedAt: Date.now(),
        respondedAt: null,
        clientComment: "",
      };
      dispatch({ type: "add-deliverable", deliverable });
      logActivity({
        type: "system",
        summary: `Ready for your review: ${deliverable.title}.`,
        dealId: deliverable.dealId,
        companyId: deliverable.companyId,
        clientVisible: true,
      });
      return deliverable;
    },
    /**
     * Client verdict from the portal. Approvals celebrate; change requests
     * become a due-tomorrow task so the comment never gets lost.
     */
    respondDeliverable: (
      id: string,
      status: "approved" | "changes_requested",
      comment: string,
    ) => {
      const deliverable = state.deliverables.find((d) => d.id === id);
      if (!deliverable || deliverable.status !== "in_review") return;
      dispatch({
        type: "respond-deliverable",
        id,
        status,
        comment: comment.trim(),
        at: Date.now(),
      });
      if (status === "approved") {
        logActivity({
          type: "system",
          summary: `Deliverable approved: ${deliverable.title}.`,
          dealId: deliverable.dealId,
          companyId: deliverable.companyId,
          clientVisible: true,
        });
      } else {
        dispatch({
          type: "add-task",
          task: {
            id: uid(),
            title: `Revise: ${deliverable.title}${comment.trim() ? ` — "${comment.trim()}"` : ""}`,
            dueAt: Date.now() + DAY,
            done: false,
            dealId: deliverable.dealId,
            contactId: null,
            createdAt: Date.now(),
          },
        });
        logActivity({
          type: "note",
          summary: `Changes requested on ${deliverable.title}${comment.trim() ? `: "${comment.trim()}"` : "."}`,
          dealId: deliverable.dealId,
          companyId: deliverable.companyId,
          clientVisible: true,
        });
      }
    },

    renameStage: (id: string, name: string) =>
      dispatch({ type: "rename-stage", id, name }),
    addStage: (name: string) =>
      dispatch({
        type: "add-stage",
        stage: { id: uid(), name, kind: "open" },
        beforeClosed: true,
      }),
    removeStage: (id: string) => dispatch({ type: "remove-stage", id }),
    moveStage: (id: string, dir: -1 | 1) =>
      dispatch({ type: "move-stage", id, dir }),

    addRule: (rule: Omit<AutomationRule, "id">) =>
      dispatch({ type: "add-rule", rule: { ...rule, id: uid() } }),
    toggleRule: (id: string) => dispatch({ type: "toggle-rule", id }),
    deleteRule: (id: string) => dispatch({ type: "delete-rule", id }),

    markNotifsRead: (ids: string[]) =>
      dispatch({ type: "mark-notifs-read", ids }),
    requestOpen: (request: OpenRequest | null) =>
      dispatch({ type: "set-open-request", request }),

    addTeamMember: async (
      name: string,
      email: string,
      role: TeamRole,
    ): Promise<InviteResult> => {
      dispatch({
        type: "add-team-member",
        member: {
          id: uid(),
          name,
          email,
          role,
          hue: Math.floor(Math.random() * 360),
        },
      });
      return { ok: true };
    },
    removeTeamMember: (id: string) =>
      dispatch({ type: "remove-team-member", id }),
    setTeamRole: (id: string, role: TeamRole) =>
      dispatch({ type: "set-team-role", id, role }),

    inviteClient: async (
      _companyId?: string,
      _email?: string,
      _name?: string,
    ): Promise<InviteResult> => {
      void _companyId;
      void _email;
      void _name;
      return {
        ok: false,
        error: "Client invites need a signed-in workspace — this is the demo.",
      };
    },
    revokeClientAccess: async (_companyId?: string): Promise<InviteResult> => {
      void _companyId;
      return { ok: true };
    },

    saveProposal: (proposal: Proposal) =>
      dispatch({
        type: "save-proposal",
        proposal: { ...proposal, updatedAt: Date.now() },
      }),
    deleteProposal: (id: string) => dispatch({ type: "delete-proposal", id }),

    saveDoc: (input: Omit<DocArticle, "id" | "updatedAt" | "position"> & { id?: string }) => {
      const existing = input.id
        ? state.docs.find((d) => d.id === input.id)
        : undefined;
      const article: DocArticle = {
        ...input,
        id: input.id ?? uid(),
        updatedAt: Date.now(),
        position: existing?.position ?? state.docs.length,
      };
      dispatch({ type: "save-doc", article });
      return article;
    },
    deleteDoc: (id: string) => dispatch({ type: "delete-doc", id }),

    saveVaultItem: (input: {
      id?: string;
      companyId: string | null;
      name: string;
      category: VaultCategory;
      username: string;
      url: string;
      secret?: string;
    }) => {
      const existing = input.id
        ? state.vault.find((v) => v.id === input.id)
        : undefined;
      const entry: VaultEntry = {
        id: input.id ?? uid(),
        companyId: input.companyId,
        name: input.name,
        category: input.category,
        username: input.username,
        url: input.url,
        hasSecret: Boolean(input.secret) || (existing?.hasSecret ?? false),
        lastAccessAt: existing?.lastAccessAt ?? null,
      };
      if (input.secret) demoSecrets.set(entry.id, input.secret);
      dispatch({ type: "save-vault", entry });
      return entry;
    },
    deleteVaultItem: (id: string) => dispatch({ type: "delete-vault", id }),
    revealVaultSecret: async (id: string): Promise<string> =>
      demoSecrets.get(id) ?? "",
  };
}

export type CrmActions = ReturnType<typeof buildDemoActions>;

type CrmContextValue = {
  state: CrmState;
  actions: CrmActions;
  /** True while the database engine loads the workspace. */
  loading: boolean;
  /** Which engine is running — "demo" (local) or "db" (Supabase). */
  mode: "demo" | "db";
};

const CrmContext = createContext<CrmContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Demo engine                                                         */
/* ------------------------------------------------------------------ */

function DemoCrmProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const actions = useMemo(() => buildDemoActions(dispatch, state), [state]);
  const value = useMemo(
    () => ({ state, actions, loading: !ready, mode: "demo" as const }),
    [state, actions, ready],
  );

  // Persist everything except transient UI state. Ephemeral (?noonboard)
  // sessions never write, so tests can't clobber real data.
  useEffect(() => {
    if (isEphemeralSession()) return;
    try {
      // JSON.stringify drops undefined keys, so `ui` never gets persisted.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, ui: undefined }),
      );
    } catch {
      // Storage full or unavailable — the app keeps working in-memory.
    }
  }, [state]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Database engine                                                     */
/* ------------------------------------------------------------------ */

function dbBaseState(): CrmState {
  return { ...emptyState(makeSeedState()), onboarded: false, docs: [] };
}

function DbCrmProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<CrmState>(dbBaseState);
  const [loading, setLoading] = useState(true);
  // Action handlers need the latest state without rebuilding the actions
  // object every render — they read it through this getter at event time.
  const stateRef = useRef<CrmState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const getState = useCallback(() => stateRef.current, []);

  const workspaceId =
    session.membership?.workspaceId ?? session.clientAccess?.workspaceId ?? null;
  const userId = session.user?.id ?? null;

  const refresh = useCallback(async () => {
    if (!workspaceId || !userId) {
      setState(dbBaseState());
      setLoading(false);
      return;
    }
    try {
      const loaded = await loadWorkspaceState(supabase, workspaceId, userId);
      setState(loaded ?? dbBaseState());
    } catch (err) {
      console.error("Workspace load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, workspaceId, userId]);

  useEffect(() => {
    // Deferred a tick — refresh() may set state synchronously (no workspace).
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  // Membership tables need a profile join — refetch those lists (debounced)
  // instead of mapping raw realtime rows.
  const teamRefreshTimer = useRef<number | null>(null);
  const refetchTeamLists = useCallback(() => {
    if (teamRefreshTimer.current) window.clearTimeout(teamRefreshTimer.current);
    teamRefreshTimer.current = window.setTimeout(async () => {
      if (!workspaceId) return;
      const [membersRes, companyMembersRes] = await Promise.all([
        supabase.from("workspace_members").select("*").eq("workspace_id", workspaceId),
        supabase.from("company_members").select("*").eq("workspace_id", workspaceId),
      ]);
      const [team, clientUsers] = await Promise.all([
        mapTeam(supabase, membersRes.data ?? []),
        mapClientUsers(supabase, companyMembersRes.data ?? []),
      ]);
      setState((prev) => ({ ...prev, team, clientUsers }));
    }, 250);
  }, [supabase, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase.channel(`workspace-${workspaceId}`);
    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          setState((prev) => {
            const result = applyChange(
              prev,
              table,
              payload.eventType as "INSERT" | "UPDATE" | "DELETE",
              payload.new as Record<string, unknown>,
              payload.old as Record<string, unknown>,
            );
            if (result.needsTeamRefresh) refetchTeamLists();
            return result.state;
          });
        },
      );
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, workspaceId, refetchTeamLists]);

  const actions = useMemo(
    () =>
      // getState reads the ref inside event handlers only, never in render.
      // eslint-disable-next-line react-hooks/refs
      buildDbActions({
        db: supabase,
        setState,
        getState,
        refresh,
        session,
        workspaceId,
        userId,
      }),
    [supabase, getState, refresh, session, workspaceId, userId],
  );

  const value = useMemo(
    () => ({ state, actions, loading, mode: "db" as const }),
    [state, actions, loading],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

type DbActionCtx = {
  db: Db;
  setState: React.Dispatch<React.SetStateAction<CrmState>>;
  getState: () => CrmState;
  refresh: () => Promise<void>;
  session: Session;
  workspaceId: string | null;
  userId: string | null;
};

function buildDbActions(ctx: DbActionCtx): CrmActions {
  const { db, setState, getState, refresh, session, userId } = ctx;
  const ws = () => ctx.workspaceId as string;

  /** Optimistic local update via the demo reducer's action vocabulary. */
  const local = (action: Action) => setState((prev) => reducer(prev, action));

  /** Run a write; on failure log and reconcile from the server. */
  const write = (op: () => PromiseLike<{ error: { message: string } | null }>) => {
    void (async () => {
      try {
        const { error } = await op();
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("CRM write failed:", err);
        void refresh();
      }
    })();
  };

  const iso = (at: number) => new Date(at).toISOString();

  const logActivity = (input: LogActivityInput) => {
    const activity: Activity = {
      id: uid(),
      type: input.type,
      summary: input.summary,
      at: Date.now(),
      dealId: input.dealId ?? null,
      contactId: input.contactId ?? null,
      companyId: input.companyId ?? null,
      clientVisible: input.clientVisible ?? false,
    };
    local({ type: "log-activity", activity });
    write(() =>
      db.from("activities").insert({
        id: activity.id,
        workspace_id: ws(),
        type: activity.type,
        summary: activity.summary,
        at: iso(activity.at),
        deal_id: activity.dealId,
        contact_id: activity.contactId,
        company_id: activity.companyId,
        client_visible: activity.clientVisible,
      }),
    );
  };

  /** Companies flipping to client get default site + analytics rows. */
  const ensureInfra = (company: Company) => {
    if (!company.isClient) return;
    const hasSite = Boolean(getState().sites[company.id]);
    void ensureClientInfra(db, ws(), company, hasSite).catch((err) =>
      console.error("ensureClientInfra:", err),
    );
  };

  return {
    completeOnboarding: async (workspaceName, template, withSampleData) => {
      const { data: workspaceId, error } = await db.rpc("create_workspace", {
        p_name: workspaceName,
        p_template: template,
      });
      if (error || !workspaceId) {
        console.error("create_workspace failed:", error?.message);
        return;
      }
      try {
        if (withSampleData) {
          const seed = makeSeedState();
          await importWorkspaceData(db, workspaceId, seed, {
            replaceStages: true,
            demoVaultSecrets: true,
          });
        } else {
          await importWorkspaceData(db, workspaceId, { docs: makeSeedDocs() });
        }
      } catch (err) {
        console.error("Workspace seeding failed:", err);
      }
      await session.refresh();
    },

    resetDemo: () => {
      void (async () => {
        try {
          const workspaceId = ws();
          // Order matters only for readability — cascades do the real work.
          for (const table of [
            "tickets",
            "deliverables",
            "contracts",
            "email_threads",
            "time_entries",
            "retainers",
            "invoices",
            "deals",
            "events",
            "tasks",
            "activities",
            "leads",
            "contacts",
            "companies",
            "vault_items",
            "proposals",
            "automation_rules",
            "doc_articles",
            "stages",
          ] as const) {
            const { error } = await db
              .from(table)
              .delete()
              .eq("workspace_id", workspaceId);
            if (error) throw new Error(`${table}: ${error.message}`);
          }
          await importWorkspaceData(db, workspaceId, makeSeedState(), {
            demoVaultSecrets: true,
          });
          await refresh();
        } catch (err) {
          console.error("Restore sample data failed:", err);
          void refresh();
        }
      })();
    },

    importState: async (data) => {
      // Imported stages are added (not swapped in) — replacing would
      // cascade-delete every existing deal.
      await importWorkspaceData(db, ws(), data);
      await refresh();
    },

    refresh: () => void refresh(),

    setWorkspaceName: (name) => {
      local({ type: "set-workspace-name", name });
      write(() => db.from("workspaces").update({ name }).eq("id", ws()));
    },
    setPlan: (plan) => {
      local({ type: "set-plan", plan });
      write(() => db.from("workspaces").update({ plan }).eq("id", ws()));
    },

    addContact: (input) => {
      const contact: Contact = {
        ...input,
        id: uid(),
        createdAt: Date.now(),
        hue: Math.floor(Math.random() * 360),
      };
      local({ type: "add-contact", contact });
      write(() =>
        db.from("contacts").insert({
          id: contact.id,
          workspace_id: ws(),
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          role: contact.role,
          company_id: contact.companyId,
          hue: contact.hue,
          tags: contact.tags,
          notes: contact.notes,
        }),
      );
      return contact;
    },
    updateContact: (id, patch) => {
      local({ type: "update-contact", id, patch });
      write(() =>
        db
          .from("contacts")
          .update({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.email !== undefined && { email: patch.email }),
            ...(patch.phone !== undefined && { phone: patch.phone }),
            ...(patch.role !== undefined && { role: patch.role }),
            ...(patch.companyId !== undefined && { company_id: patch.companyId }),
            ...(patch.tags !== undefined && { tags: patch.tags }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
          })
          .eq("id", id),
      );
    },
    deleteContact: (id) => {
      local({ type: "delete-contact", id });
      write(() => db.from("contacts").delete().eq("id", id));
    },

    addLeads: (inputs) => {
      const leads = buildNewLeads(inputs, getState().leads);
      if (leads.length === 0) return leads;
      local({ type: "add-leads", leads });
      void (async () => {
        try {
          const rows = leads.map((l) => ({
            id: l.id,
            workspace_id: ws(),
            name: l.name,
            email: l.email,
            phone: l.phone,
            role: l.role,
            company: l.company,
            website: l.website,
            source: l.source,
            status: l.status,
            tags: l.tags,
            notes: l.notes,
            created_at: iso(l.createdAt),
          }));
          // Bulk pastes can run to thousands of rows — insert in batches.
          for (let i = 0; i < rows.length; i += 200) {
            const { error } = await db.from("leads").insert(rows.slice(i, i + 200));
            if (error) throw new Error(error.message);
          }
        } catch (err) {
          console.error("addLeads:", err);
          void refresh();
        }
      })();
      return leads;
    },
    updateLead: (id, patch) => {
      local({ type: "update-leads", ids: [id], patch });
      write(() => db.from("leads").update(leadPatchRow(patch)).eq("id", id));
    },
    updateLeads: (ids, patch) => {
      if (ids.length === 0) return;
      local({ type: "update-leads", ids, patch });
      write(() => db.from("leads").update(leadPatchRow(patch)).in("id", ids));
    },
    deleteLeads: (ids) => {
      if (ids.length === 0) return;
      local({ type: "delete-leads", ids });
      write(() => db.from("leads").delete().in("id", ids));
    },
    convertLead: (id) => {
      const lead = getState().leads.find((l) => l.id === id);
      if (!lead || lead.status === "converted") return null;
      const { newCompany, contact } = conversionPlan(lead, getState().companies);
      if (newCompany) local({ type: "add-company", company: newCompany });
      local({ type: "add-contact", contact });
      local({
        type: "update-leads",
        ids: [id],
        patch: { status: "converted", convertedContactId: contact.id },
      });
      void (async () => {
        try {
          if (newCompany) {
            const { error } = await db.from("companies").insert({
              id: newCompany.id,
              workspace_id: ws(),
              name: newCompany.name,
              domain: newCompany.domain,
              industry: newCompany.industry,
              location: newCompany.location,
              is_client: newCompany.isClient,
              notes: newCompany.notes,
            });
            if (error) throw new Error(error.message);
          }
          const contactRes = await db.from("contacts").insert({
            id: contact.id,
            workspace_id: ws(),
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            role: contact.role,
            company_id: contact.companyId,
            hue: contact.hue,
            tags: contact.tags,
            notes: contact.notes,
          });
          if (contactRes.error) throw new Error(contactRes.error.message);
          const leadRes = await db
            .from("leads")
            .update({ status: "converted", converted_contact_id: contact.id })
            .eq("id", id);
          if (leadRes.error) throw new Error(leadRes.error.message);
        } catch (err) {
          console.error("convertLead:", err);
          void refresh();
        }
      })();
      logActivity({
        type: "system",
        summary: `Lead converted to contact: ${contact.name}${lead.company ? ` (${lead.company})` : ""}.`,
        contactId: contact.id,
        companyId: contact.companyId,
      });
      return contact;
    },

    addCompany: (input) => {
      const company: Company = { ...input, id: uid() };
      local({ type: "add-company", company });
      void (async () => {
        const { error } = await db.from("companies").insert({
          id: company.id,
          workspace_id: ws(),
          name: company.name,
          domain: company.domain,
          industry: company.industry,
          location: company.location,
          is_client: company.isClient,
          notes: company.notes,
        });
        if (error) {
          console.error("addCompany:", error.message);
          void refresh();
          return;
        }
        ensureInfra(company);
      })();
      return company;
    },
    updateCompany: (id, patch) => {
      local({ type: "update-company", id, patch });
      void (async () => {
        const { error } = await db
          .from("companies")
          .update({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.domain !== undefined && { domain: patch.domain }),
            ...(patch.industry !== undefined && { industry: patch.industry }),
            ...(patch.location !== undefined && { location: patch.location }),
            ...(patch.isClient !== undefined && { is_client: patch.isClient }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
          })
          .eq("id", id);
        if (error) {
          console.error("updateCompany:", error.message);
          void refresh();
          return;
        }
        const company = getState().companies.find((c) => c.id === id);
        if (company) ensureInfra(company);
      })();
    },
    deleteCompany: (id) => {
      local({ type: "delete-company", id });
      write(() => db.from("companies").delete().eq("id", id));
    },

    addDeal: (input) => {
      const now = Date.now();
      const deal: Deal = {
        ...input,
        id: uid(),
        createdAt: now,
        stageChangedAt: now,
        closedAt: null,
      };
      local({ type: "add-deal", deal });
      write(() =>
        db.rpc("create_deal", {
          p_id: deal.id,
          p_workspace: ws(),
          p_name: deal.name,
          p_company: deal.companyId as string,
          p_contact: deal.contactId as string,
          p_stage: deal.stageId,
          p_value: deal.value,
          p_source: deal.source,
        }),
      );
      return deal;
    },
    updateDeal: (id, patch) => {
      local({ type: "update-deal", id, patch });
      write(() =>
        db
          .from("deals")
          .update({
            ...(patch.name !== undefined && { name: patch.name }),
            ...(patch.companyId !== undefined && { company_id: patch.companyId }),
            ...(patch.contactId !== undefined && { contact_id: patch.contactId }),
            ...(patch.value !== undefined && { value: patch.value }),
            ...(patch.source !== undefined && { source: patch.source }),
          })
          .eq("id", id),
      );
    },
    moveDeal: (id, stageId) => {
      const deal = getState().deals.find((d) => d.id === id);
      const stage = getState().stages.find((s) => s.id === stageId);
      if (!deal || !stage || deal.stageId === stageId) return;
      local({ type: "move-deal", id, stageId, at: Date.now() });
      write(() => db.rpc("move_deal", { p_deal: id, p_stage: stageId }));
    },
    deleteDeal: (id) => {
      local({ type: "delete-deal", id });
      write(() => db.from("deals").delete().eq("id", id));
    },

    addTask: (title, dueAt, link = {}) => {
      const task: Task = {
        id: uid(),
        title,
        dueAt,
        done: false,
        dealId: link.dealId ?? null,
        contactId: link.contactId ?? null,
        createdAt: Date.now(),
      };
      local({ type: "add-task", task });
      write(() =>
        db.from("tasks").insert({
          id: task.id,
          workspace_id: ws(),
          title: task.title,
          due_at: iso(task.dueAt),
          done: false,
          deal_id: task.dealId,
          contact_id: task.contactId,
        }),
      );
    },
    updateTask: (id, patch) => {
      local({ type: "update-task", id, patch });
      write(() =>
        db
          .from("tasks")
          .update({
            ...(patch.title !== undefined && { title: patch.title }),
            ...(patch.dueAt !== undefined && { due_at: iso(patch.dueAt) }),
          })
          .eq("id", id),
      );
    },
    toggleTask: (id) => {
      const task = getState().tasks.find((t) => t.id === id);
      if (!task) return;
      local({ type: "toggle-task", id });
      write(() => db.from("tasks").update({ done: !task.done }).eq("id", id));
    },
    deleteTask: (id) => {
      local({ type: "delete-task", id });
      write(() => db.from("tasks").delete().eq("id", id));
    },

    addEvent: (input) => {
      const event: CalEvent = { ...input, id: uid(), done: false };
      local({ type: "add-event", event });
      write(() =>
        db.from("events").insert({
          id: event.id,
          workspace_id: ws(),
          title: event.title,
          kind: event.kind,
          start_at: iso(event.startAt),
          duration_min: event.durationMin,
          deal_id: event.dealId,
          contact_id: event.contactId,
          notes: event.notes,
          done: false,
        }),
      );
      return event;
    },
    updateEvent: (id, patch) => {
      local({ type: "update-event", id, patch });
      write(() =>
        db
          .from("events")
          .update({
            ...(patch.title !== undefined && { title: patch.title }),
            ...(patch.kind !== undefined && { kind: patch.kind }),
            ...(patch.startAt !== undefined && { start_at: iso(patch.startAt) }),
            ...(patch.durationMin !== undefined && { duration_min: patch.durationMin }),
            ...(patch.dealId !== undefined && { deal_id: patch.dealId }),
            ...(patch.contactId !== undefined && { contact_id: patch.contactId }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
            ...(patch.done !== undefined && { done: patch.done }),
          })
          .eq("id", id),
      );
    },
    deleteEvent: (id) => {
      local({ type: "delete-event", id });
      write(() => db.from("events").delete().eq("id", id));
    },
    completeEvent: (id) => {
      const event = getState().events.find((e) => e.id === id);
      if (!event || event.done) return;
      local({ type: "update-event", id, patch: { done: true } });
      write(() => db.from("events").update({ done: true }).eq("id", id));
      if (event.kind === "call" || event.kind === "meeting") {
        const deal = event.dealId
          ? getState().deals.find((d) => d.id === event.dealId)
          : null;
        logActivity({
          type: event.kind === "call" ? "call" : "meeting",
          summary: `${event.title} — completed.`,
          dealId: event.dealId,
          contactId: event.contactId,
          companyId: deal?.companyId ?? null,
        });
      }
    },

    logActivity,

    addInvoice: (input) => {
      const now = Date.now();
      const invoice: Invoice = {
        id: uid(),
        number: nextInvoiceNumber(getState().invoices),
        companyId: input.companyId,
        dealId: input.dealId ?? null,
        label: input.label,
        amount: input.amount,
        issuedAt: now,
        dueAt: now + (input.dueInDays ?? 14) * DAY,
        paidAt: null,
        status: "due",
      };
      local({ type: "add-invoice", invoice });
      write(() =>
        db.rpc("create_invoice", {
          p_id: invoice.id,
          p_company: invoice.companyId,
          p_deal: invoice.dealId as string,
          p_label: invoice.label,
          p_amount: invoice.amount,
          p_due_days: input.dueInDays ?? 14,
        }),
      );
      return invoice;
    },
    sendInvoiceReminder: (id) => {
      const invoice = getState().invoices.find((i) => i.id === id);
      if (!invoice || invoice.status !== "due") return;
      write(() => db.rpc("send_invoice_reminder", { p_invoice: id }));
      logActivity({
        type: "email",
        summary: `Payment reminder sent for ${invoice.number} — ${invoice.label}.`,
        dealId: invoice.dealId,
        companyId: invoice.companyId,
        clientVisible: true,
      });
    },
    payInvoice: (id) => {
      const invoice = getState().invoices.find((i) => i.id === id);
      if (!invoice || invoice.status !== "due") return;
      local({ type: "pay-invoice", id, at: Date.now() });
      write(() => db.rpc("pay_invoice", { p_invoice: id }));
    },

    saveRetainer: (input) => {
      const existing = input.id
        ? getState().retainers.find((r) => r.id === input.id)
        : undefined;
      const active = input.active ?? existing?.active ?? true;
      const autoInvoice = input.autoInvoice ?? existing?.autoInvoice ?? true;
      const retainer: Retainer = {
        id: input.id ?? uid(),
        companyId: input.companyId,
        name: input.name,
        amount: input.amount,
        includedHours: input.includedHours,
        billingDay: input.billingDay,
        active,
        autoInvoice,
        nextInvoiceOn: !active || !autoInvoice
          ? null
          : existing?.billingDay === input.billingDay && existing.nextInvoiceOn
            ? existing.nextInvoiceOn
            : nextBillingDate(input.billingDay),
        notes: input.notes?.trim() ?? existing?.notes ?? "",
        createdAt: existing?.createdAt ?? Date.now(),
      };
      local({ type: "save-retainer", retainer });
      write(() =>
        db.from("retainers").upsert({
          id: retainer.id,
          workspace_id: ws(),
          company_id: retainer.companyId,
          name: retainer.name,
          amount: retainer.amount,
          included_hours: retainer.includedHours,
          billing_day: retainer.billingDay,
          active: retainer.active,
          auto_invoice: retainer.autoInvoice,
          next_invoice_on:
            retainer.nextInvoiceOn === null
              ? null
              : new Date(retainer.nextInvoiceOn).toISOString().slice(0, 10),
          notes: retainer.notes,
          created_at: iso(retainer.createdAt),
        }),
      );
      return retainer;
    },
    deleteRetainer: (id) => {
      local({ type: "delete-retainer", id });
      write(() => db.from("retainers").delete().eq("id", id));
    },
    billRetainer: (id) => {
      const retainer = getState().retainers.find((r) => r.id === id);
      if (!retainer || !retainer.active) return;
      // The invoice, activity and schedule advance come back via realtime —
      // the RPC does the whole step atomically (and emails the client).
      write(() => db.rpc("bill_retainer", { p_retainer: id }));
    },

    logTime: (input) => {
      const state = getState();
      const entry: TimeEntry = {
        id: uid(),
        companyId: input.companyId ?? null,
        retainerId: input.retainerId ?? null,
        taskId: input.taskId ?? null,
        dealId: input.dealId ?? null,
        author:
          state.team.find((m) => m.id === userId)?.name ??
          state.team[0]?.name ??
          "Teammate",
        minutes: Math.round(input.minutes),
        note: input.note?.trim() ?? "",
        entryDate: input.entryDate ?? Date.now(),
        billable: input.billable ?? true,
        createdAt: Date.now(),
      };
      local({ type: "add-time-entry", entry });
      write(() =>
        db.from("time_entries").insert({
          id: entry.id,
          workspace_id: ws(),
          company_id: entry.companyId,
          retainer_id: entry.retainerId,
          task_id: entry.taskId,
          deal_id: entry.dealId,
          user_id: userId,
          author: entry.author,
          minutes: entry.minutes,
          note: entry.note,
          entry_date: new Date(entry.entryDate).toISOString().slice(0, 10),
          billable: entry.billable,
        }),
      );
      return entry;
    },
    deleteTimeEntry: (id) => {
      local({ type: "delete-time-entry", id });
      write(() => db.from("time_entries").delete().eq("id", id));
    },

    sendEmail: async (input) => {
      const to = input.to.map((t) => t.trim()).filter(Boolean);
      const body = input.body.trim();
      if (to.length === 0 || !body) return null;
      // No optimistic append: the RPC creates the message (and possibly the
      // thread) server-side, and realtime delivers both within the second.
      const { data, error } = await db.rpc("send_thread_email", {
        p_workspace: ws(),
        p_thread: (input.threadId ?? null) as unknown as string,
        p_contact: (input.contactId ?? null) as unknown as string,
        p_lead: (input.leadId ?? null) as unknown as string,
        p_to: to,
        p_subject: input.subject,
        p_body: body,
      });
      if (error) {
        console.error("sendEmail:", error.message);
        return null;
      }
      return data ?? null;
    },
    markThreadRead: (id) => {
      const thread = getState().emailThreads.find((t) => t.id === id);
      if (!thread || !thread.unread) return;
      local({ type: "mark-thread-read", id });
      write(() => db.from("email_threads").update({ unread: false }).eq("id", id));
    },
    deleteEmailThread: (id) => {
      local({ type: "delete-email-thread", id });
      write(() => db.from("email_threads").delete().eq("id", id));
    },
    setInboundAddress: (address) => {
      const trimmed = address.trim();
      local({ type: "set-inbound-address", address: trimmed });
      write(() =>
        db
          .from("workspaces")
          .update({ inbound_address: trimmed || null })
          .eq("id", ws()),
      );
    },

    sendContract: (input) => {
      const contract: Contract = {
        id: uid(),
        companyId: input.companyId,
        dealId: input.dealId ?? null,
        title: input.title,
        summary: input.summary,
        amount: input.amount,
        terms: input.terms ?? [
          "50% deposit invoiced on signature, balance on delivery.",
          "Scope changes are quoted before work starts.",
        ],
        status: "sent",
        sentAt: Date.now(),
        viewedAt: null,
        signedAt: null,
        signedBy: null,
      };
      local({ type: "add-contract", contract });
      write(() =>
        db.rpc("create_contract", {
          p_id: contract.id,
          p_company: contract.companyId,
          p_deal: contract.dealId as string,
          p_title: contract.title,
          p_summary: contract.summary,
          p_amount: contract.amount,
          p_terms: contract.terms,
        }),
      );
      return contract;
    },
    markContractViewed: (id) => {
      const contract = getState().contracts.find((c) => c.id === id);
      if (!contract || contract.status !== "sent") return;
      local({
        type: "update-contract",
        id,
        patch: { status: "viewed", viewedAt: Date.now() },
      });
      write(() => db.rpc("mark_contract_viewed", { p_contract: id }));
    },
    signContract: (id, signerName) => {
      const contract = getState().contracts.find((c) => c.id === id);
      if (!contract || contract.status === "signed") return;
      local({
        type: "update-contract",
        id,
        patch: { status: "signed", signedAt: Date.now(), signedBy: signerName },
      });
      write(() => db.rpc("sign_contract", { p_contract: id, p_signer: signerName }));
    },

    createTicket: (input) => {
      const now = Date.now();
      const ticket: Ticket = {
        id: uid(),
        companyId: input.companyId,
        contactId: input.contactId ?? null,
        topic: input.topic,
        subject: input.subject,
        status: "open",
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: uid(),
            from: "client",
            author: input.author,
            text: input.details?.trim() || input.subject,
            at: now,
            attachments: input.attachments ?? [],
          },
        ],
      };
      local({ type: "add-ticket", ticket });
      write(() =>
        db.rpc("create_ticket", {
          p_id: ticket.id,
          p_company: ticket.companyId,
          p_contact: ticket.contactId as string,
          p_author: input.author,
          p_topic: ticket.topic,
          p_subject: ticket.subject,
          p_details: input.details ?? "",
          p_attachments: input.attachments ?? [],
        }),
      );
      return ticket;
    },
    replyTicket: (id, from, author, text, attachments) => {
      const ticket = getState().tickets.find((t) => t.id === id);
      if (!ticket || (!text.trim() && !attachments?.length)) return;
      local({
        type: "ticket-message",
        ticketId: id,
        message: {
          id: uid(),
          from,
          author,
          text: text.trim(),
          at: Date.now(),
          attachments: attachments ?? [],
        },
        status:
          from === "agency" && ticket.status === "open"
            ? "in_progress"
            : undefined,
      });
      write(() =>
        db.rpc("reply_ticket", {
          p_ticket: id,
          p_author: author,
          p_body: text,
          p_attachments: attachments ?? [],
        }),
      );
    },
    setTicketStatus: (id, status) => {
      local({ type: "set-ticket-status", id, status });
      write(() =>
        db
          .from("tickets")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id),
      );
    },

    setEntitlements: (companyId, toolIds) => {
      local({ type: "set-entitlements", companyId, toolIds });
      write(() =>
        db.from("entitlements").upsert(
          { company_id: companyId, workspace_id: ws(), tool_ids: toolIds },
          { onConflict: "company_id" },
        ),
      );
    },

    addDeliverable: (input) => {
      const deliverable: Deliverable = {
        id: uid(),
        companyId: input.companyId,
        dealId: input.dealId ?? null,
        title: input.title,
        kind: input.kind,
        url: input.url,
        filePath: input.filePath ?? "",
        note: input.note?.trim() ?? "",
        status: "in_review",
        postedAt: Date.now(),
        respondedAt: null,
        clientComment: "",
      };
      local({ type: "add-deliverable", deliverable });
      write(() =>
        db.from("deliverables").insert({
          id: deliverable.id,
          workspace_id: ws(),
          company_id: deliverable.companyId,
          deal_id: deliverable.dealId,
          title: deliverable.title,
          kind: deliverable.kind,
          url: deliverable.url,
          file_path: deliverable.filePath,
          note: deliverable.note,
        }),
      );
      logActivity({
        type: "system",
        summary: `Ready for your review: ${deliverable.title}.`,
        dealId: deliverable.dealId,
        companyId: deliverable.companyId,
        clientVisible: true,
      });
      return deliverable;
    },
    respondDeliverable: (id, status, comment) => {
      const deliverable = getState().deliverables.find((d) => d.id === id);
      if (!deliverable || deliverable.status !== "in_review") return;
      local({
        type: "respond-deliverable",
        id,
        status,
        comment: comment.trim(),
        at: Date.now(),
      });
      write(() =>
        db.rpc("respond_deliverable", {
          p_id: id,
          p_status: status,
          p_comment: comment,
        }),
      );
    },

    renameStage: (id, name) => {
      local({ type: "rename-stage", id, name });
      write(() => db.from("stages").update({ name }).eq("id", id));
    },
    addStage: (name) => {
      const open = getState().stages.filter((s) => s.kind === "open");
      const position =
        open.reduce(
          (max, s) =>
            Math.max(max, (s as Stage & { position?: number }).position ?? 0),
          0,
        ) + 1;
      const stage: Stage & { position: number } = {
        id: uid(),
        name,
        kind: "open",
        position,
      };
      local({ type: "add-stage", stage, beforeClosed: true });
      write(() =>
        db.from("stages").insert({
          id: stage.id,
          workspace_id: ws(),
          name,
          kind: "open",
          position,
        }),
      );
    },
    removeStage: (id) => {
      const open = getState().stages.filter((s) => s.kind === "open");
      if (open.length <= 1) return;
      const fallback = open.find((s) => s.id !== id);
      if (!fallback) return;
      local({ type: "remove-stage", id });
      void (async () => {
        try {
          const moved = await db
            .from("deals")
            .update({ stage_id: fallback.id })
            .eq("stage_id", id);
          if (moved.error) throw new Error(moved.error.message);
          const del = await db.from("stages").delete().eq("id", id);
          if (del.error) throw new Error(del.error.message);
        } catch (err) {
          console.error("removeStage:", err);
          void refresh();
        }
      })();
    },
    moveStage: (id, dir) => {
      const stages = getState().stages as (Stage & { position?: number })[];
      const open = stages.filter((s) => s.kind === "open");
      const idx = open.findIndex((s) => s.id === id);
      const to = idx + dir;
      if (idx === -1 || to < 0 || to >= open.length) return;
      const a = open[idx];
      const b = open[to];
      local({ type: "move-stage", id, dir });
      void (async () => {
        try {
          // Swap normalized positions (index-based, in case rows share values).
          const posA = to + 1;
          const posB = idx + 1;
          const r1 = await db.from("stages").update({ position: posA }).eq("id", a.id);
          if (r1.error) throw new Error(r1.error.message);
          const r2 = await db.from("stages").update({ position: posB }).eq("id", b.id);
          if (r2.error) throw new Error(r2.error.message);
        } catch (err) {
          console.error("moveStage:", err);
          void refresh();
        }
      })();
    },

    addRule: (rule) => {
      const withId: AutomationRule = { ...rule, id: uid() };
      local({ type: "add-rule", rule: withId });
      write(() =>
        db.from("automation_rules").insert({
          id: withId.id,
          workspace_id: ws(),
          name: withId.name,
          enabled: withId.enabled,
          trigger: withId.trigger,
          action: withId.action,
        }),
      );
    },
    toggleRule: (id) => {
      const rule = getState().rules.find((r) => r.id === id);
      if (!rule) return;
      local({ type: "toggle-rule", id });
      write(() =>
        db.from("automation_rules").update({ enabled: !rule.enabled }).eq("id", id),
      );
    },
    deleteRule: (id) => {
      local({ type: "delete-rule", id });
      write(() => db.from("automation_rules").delete().eq("id", id));
    },

    markNotifsRead: (ids) => {
      if (ids.length === 0 || !userId) return;
      local({ type: "mark-notifs-read", ids });
      write(() =>
        db.from("read_notifications").upsert(
          ids.map((notifId) => ({
            user_id: userId,
            workspace_id: ws(),
            notif_id: notifId,
          })),
          { onConflict: "user_id,workspace_id,notif_id", ignoreDuplicates: true },
        ),
      );
    },
    requestOpen: (request) => local({ type: "set-open-request", request }),

    addTeamMember: async (name, email, role) => {
      const result = await inviteTeamMemberUser({
        workspaceId: ws(),
        name,
        email,
        role,
      });
      if (!result.ok) return result;
      return { ok: true };
    },
    removeTeamMember: (id) => {
      local({ type: "remove-team-member", id });
      write(() =>
        db
          .from("workspace_members")
          .delete()
          .eq("workspace_id", ws())
          .eq("user_id", id),
      );
    },
    setTeamRole: (id, role) => {
      if (role === "Owner") return; // ownership transfer is a separate flow
      local({ type: "set-team-role", id, role });
      write(() =>
        db
          .from("workspace_members")
          .update({ role: role.toLowerCase() })
          .eq("workspace_id", ws())
          .eq("user_id", id)
          .neq("role", "owner"),
      );
    },

    inviteClient: async (companyId?: string, email?: string, name?: string) => {
      if (!companyId || !email) {
        return { ok: false, error: "Pick a company and an email first." };
      }
      return inviteClientUser({ workspaceId: ws(), companyId, email, name });
    },
    revokeClientAccess: async (companyId?: string) => {
      if (!companyId) return { ok: false, error: "No company given." };
      const { error } = await db
        .from("company_members")
        .delete()
        .eq("company_id", companyId);
      if (error) return { ok: false, error: error.message };
      setState((prev) => ({
        ...prev,
        clientUsers: prev.clientUsers.filter((u) => u.companyId !== companyId),
      }));
      return { ok: true };
    },

    saveProposal: (input) => {
      const proposal = { ...input, updatedAt: Date.now() };
      local({ type: "save-proposal", proposal });
      write(() =>
        db.from("proposals").upsert({
          id: proposal.id,
          workspace_id: ws(),
          title: proposal.title,
          company_id: proposal.companyId,
          prepared_for: proposal.preparedFor,
          notes: proposal.notes,
          lines: proposal.lines,
          global_discount_pct: proposal.globalDiscountPct,
          created_at: iso(proposal.createdAt),
          updated_at: iso(proposal.updatedAt),
        }),
      );
    },
    deleteProposal: (id) => {
      local({ type: "delete-proposal", id });
      write(() => db.from("proposals").delete().eq("id", id));
    },

    saveDoc: (input) => {
      const existing = input.id
        ? getState().docs.find((d) => d.id === input.id)
        : undefined;
      const article: DocArticle = {
        ...input,
        id: input.id ?? uid(),
        updatedAt: Date.now(),
        position: existing?.position ?? getState().docs.length,
      };
      local({ type: "save-doc", article });
      write(() =>
        db.from("doc_articles").upsert({
          id: article.id,
          workspace_id: ws(),
          slug: article.slug,
          title: article.title,
          category: article.category,
          summary: article.summary,
          minutes: article.minutes,
          client_visible: article.clientVisible,
          sections: article.sections,
          position: article.position,
          updated_at: iso(article.updatedAt),
        }),
      );
      return article;
    },
    deleteDoc: (id) => {
      local({ type: "delete-doc", id });
      write(() => db.from("doc_articles").delete().eq("id", id));
    },

    saveVaultItem: (input) => {
      const existing = input.id
        ? getState().vault.find((v) => v.id === input.id)
        : undefined;
      const entry: VaultEntry = {
        id: input.id ?? uid(),
        companyId: input.companyId,
        name: input.name,
        category: input.category,
        username: input.username,
        url: input.url,
        hasSecret: Boolean(input.secret) || (existing?.hasSecret ?? false),
        lastAccessAt: existing?.lastAccessAt ?? null,
      };
      local({ type: "save-vault", entry });
      write(() =>
        db.rpc("save_vault_item", {
          p_id: (input.id ?? null) as unknown as string,
          p_workspace: ws(),
          p_company: entry.companyId as string,
          p_name: entry.name,
          p_category: entry.category,
          p_username: entry.username,
          p_url: entry.url,
          p_secret: (input.secret ?? null) as unknown as string,
        }),
      );
      return entry;
    },
    deleteVaultItem: (id) => {
      local({ type: "delete-vault", id });
      write(() => db.from("vault_items").delete().eq("id", id));
    },
    revealVaultSecret: async (id) => {
      const { data, error } = await db.rpc("reveal_vault_secret", { p_id: id });
      if (error) {
        console.error("revealVaultSecret:", error.message);
        return "";
      }
      return data ?? "";
    },
  };
}

/* ------------------------------------------------------------------ */
/* Provider selection                                                  */
/* ------------------------------------------------------------------ */

export function CrmProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const useDb = session.ready && !session.demo && session.user !== null;
  if (useDb) {
    return <DbCrmProvider session={session}>{children}</DbCrmProvider>;
  }
  return <DemoCrmProvider ready={session.ready}>{children}</DemoCrmProvider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside <CrmProvider>");
  return ctx;
}

/** Convenience lookups shared by most CRM views. */
export function useCrmLookups() {
  const { state } = useCrm();
  return useMemo(() => {
    const companyById = new Map(state.companies.map((c) => [c.id, c]));
    const contactById = new Map(state.contacts.map((c) => [c.id, c]));
    const dealById = new Map(state.deals.map((d) => [d.id, d]));
    const stageById = new Map(state.stages.map((s) => [s.id, s]));
    return { companyById, contactById, dealById, stageById };
  }, [state.companies, state.contacts, state.deals, state.stages]);
}
