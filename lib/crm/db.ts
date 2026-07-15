"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, Tables } from "@/lib/supabase/types";
import type { Proposal, ProposalLine } from "@/lib/proposals";
import { DEMO_VAULT_SECRETS, defaultSite } from "./seed";
import {
  DAY,
  daysAgo,
  uid,
  type Activity,
  type ActivityType,
  type AnalyticsDay,
  type AutomationAction,
  type AutomationRule,
  type AutomationTrigger,
  type CalEvent,
  type ClientUser,
  type Company,
  type Contact,
  type Contract,
  type CrmState,
  type Deal,
  type Deliverable,
  type DocArticle,
  type DocSection,
  type Invoice,
  type Lead,
  type SiteHealth,
  type Stage,
  type Task,
  type TeamMember,
  type Ticket,
  type TicketMessage,
  type VaultEntry,
  type Workspace,
} from "./types";

/**
 * Everything between the Supabase rows (snake_case, ISO timestamps) and the
 * app's models (camelCase, epoch ms): mappers, the workspace loader, the
 * realtime change applier and the bulk importer that both "load sample data"
 * and the localStorage/backup import run through.
 */

export type Db = SupabaseClient<Database>;

const ms = (iso: string): number => new Date(iso).getTime();
const msOrNull = (iso: string | null): number | null =>
  iso === null ? null : new Date(iso).getTime();
const iso = (at: number): string => new Date(at).toISOString();
const isoOrNull = (at: number | null): string | null =>
  at === null ? null : new Date(at).toISOString();

/* ------------------------------------------------------------------ */
/* Row -> model                                                        */
/* ------------------------------------------------------------------ */

export function rowToStage(r: Tables<"stages">): Stage & { position: number } {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind as Stage["kind"],
    position: r.position,
  };
}

export function rowToCompany(r: Tables<"companies">): Company {
  return {
    id: r.id,
    name: r.name,
    domain: r.domain,
    industry: r.industry,
    location: r.location,
    isClient: r.is_client,
    notes: r.notes,
  };
}

export function rowToContact(r: Tables<"contacts">): Contact {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    companyId: r.company_id,
    hue: r.hue,
    tags: r.tags,
    createdAt: ms(r.created_at),
    notes: r.notes,
  };
}

export function rowToLead(r: Tables<"leads">): Lead {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    company: r.company,
    website: r.website,
    source: r.source,
    status: r.status as Lead["status"],
    tags: r.tags,
    notes: r.notes,
    lastContactedAt: msOrNull(r.last_contacted_at),
    convertedContactId: r.converted_contact_id,
    createdAt: ms(r.created_at),
  };
}

export function rowToDeal(r: Tables<"deals">): Deal {
  return {
    id: r.id,
    name: r.name,
    companyId: r.company_id,
    contactId: r.contact_id,
    stageId: r.stage_id,
    value: Number(r.value),
    source: r.source,
    createdAt: ms(r.created_at),
    stageChangedAt: ms(r.stage_changed_at),
    closedAt: msOrNull(r.closed_at),
  };
}

export function rowToTask(r: Tables<"tasks">): Task {
  return {
    id: r.id,
    title: r.title,
    dueAt: ms(r.due_at),
    done: r.done,
    dealId: r.deal_id,
    contactId: r.contact_id,
    createdAt: ms(r.created_at),
  };
}

export function rowToActivity(r: Tables<"activities">): Activity {
  return {
    id: r.id,
    type: r.type as ActivityType,
    summary: r.summary,
    at: ms(r.at),
    dealId: r.deal_id,
    contactId: r.contact_id,
    companyId: r.company_id,
    clientVisible: r.client_visible,
  };
}

export function rowToEvent(r: Tables<"events">): CalEvent {
  return {
    id: r.id,
    title: r.title,
    kind: r.kind as CalEvent["kind"],
    startAt: ms(r.start_at),
    durationMin: r.duration_min,
    dealId: r.deal_id,
    contactId: r.contact_id,
    notes: r.notes,
    done: r.done,
  };
}

export function rowToInvoice(r: Tables<"invoices">): Invoice {
  return {
    id: r.id,
    number: r.number,
    companyId: r.company_id,
    dealId: r.deal_id,
    label: r.label,
    amount: Number(r.amount),
    issuedAt: ms(r.issued_at),
    dueAt: ms(r.due_at),
    paidAt: msOrNull(r.paid_at),
    status: r.status as Invoice["status"],
  };
}

export function rowToContract(r: Tables<"contracts">): Contract {
  return {
    id: r.id,
    companyId: r.company_id,
    dealId: r.deal_id,
    title: r.title,
    summary: r.summary,
    amount: Number(r.amount),
    terms: r.terms,
    status: r.status as Contract["status"],
    sentAt: ms(r.sent_at),
    viewedAt: msOrNull(r.viewed_at),
    signedAt: msOrNull(r.signed_at),
    signedBy: r.signed_by,
  };
}

export function rowToTicket(
  r: Tables<"tickets">,
  messages: TicketMessage[] = [],
): Ticket {
  return {
    id: r.id,
    companyId: r.company_id,
    contactId: r.contact_id,
    topic: r.topic,
    subject: r.subject,
    status: r.status as Ticket["status"],
    createdAt: ms(r.created_at),
    updatedAt: ms(r.updated_at),
    messages,
  };
}

export function rowToTicketMessage(r: Tables<"ticket_messages">): TicketMessage {
  return {
    id: r.id,
    from: r.from_side as TicketMessage["from"],
    author: r.author,
    text: r.body,
    at: ms(r.at),
    attachments: (r.attachments ?? []) as TicketMessage["attachments"],
  };
}

export function rowToDeliverable(r: Tables<"deliverables">): Deliverable {
  return {
    id: r.id,
    dealId: r.deal_id,
    companyId: r.company_id,
    title: r.title,
    kind: r.kind as Deliverable["kind"],
    url: r.url,
    filePath: r.file_path,
    note: r.note,
    status: r.status as Deliverable["status"],
    postedAt: ms(r.posted_at),
    respondedAt: msOrNull(r.responded_at),
    clientComment: r.client_comment,
  };
}

export function rowToRule(r: Tables<"automation_rules">): AutomationRule {
  return {
    id: r.id,
    name: r.name,
    enabled: r.enabled,
    trigger: r.trigger as AutomationTrigger,
    action: r.action as AutomationAction,
  };
}

export function rowToProposal(r: Tables<"proposals">): Proposal {
  return {
    id: r.id,
    title: r.title,
    companyId: r.company_id,
    preparedFor: r.prepared_for,
    notes: r.notes,
    lines: (r.lines as ProposalLine[]) ?? [],
    globalDiscountPct: r.global_discount_pct,
    createdAt: ms(r.created_at),
    updatedAt: ms(r.updated_at),
  };
}

export function rowToDoc(r: Tables<"doc_articles">): DocArticle {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category as DocArticle["category"],
    summary: r.summary,
    minutes: r.minutes,
    updatedAt: ms(r.updated_at),
    clientVisible: r.client_visible,
    sections: (r.sections as DocSection[]) ?? [],
    position: r.position,
  };
}

/** Explicit columns — secret_enc is column-revoked, so `*` would fail. */
export const VAULT_COLUMNS =
  "id, workspace_id, company_id, name, category, username, url, has_secret, last_access_at, created_at, updated_at";

type VaultRow = Omit<Tables<"vault_items">, "secret_enc">;

export function rowToVault(r: VaultRow): VaultEntry {
  return {
    id: r.id,
    companyId: r.company_id,
    name: r.name,
    category: r.category as VaultEntry["category"],
    username: r.username,
    url: r.url,
    hasSecret: r.has_secret,
    lastAccessAt: msOrNull(r.last_access_at),
  };
}

/** Absolute timestamps in jsonb become the view model's relative days. */
export function rowToSite(r: Tables<"sites">): SiteHealth {
  type PageJson = { path: string; title: string; views30d: number; updatedAt: number };
  type DeployJson = { label: string; at: number; kind: "content" | "feature" | "fix" };
  type BackupJson = { at: number; size: string };
  type IncidentJson = { title: string; at: number; durationMin: number };
  const pages = (r.pages as PageJson[]) ?? [];
  const deploys = (r.deploys as DeployJson[]) ?? [];
  const backups = (r.backups as BackupJson[]) ?? [];
  const incidents = (r.incidents as IncidentJson[]) ?? [];
  return {
    status: r.status as SiteHealth["status"],
    uptime90d: r.uptime_90d,
    sslDaysLeft: r.ssl_days_left,
    plan: r.plan,
    region: r.region,
    lastDeployDaysAgo: daysAgo(ms(r.last_deploy_at)),
    visits30d: r.visits_30d,
    perf: r.perf as SiteHealth["perf"],
    pages: pages.map((p) => ({
      path: p.path,
      title: p.title,
      views30d: p.views30d,
      updatedDaysAgo: daysAgo(p.updatedAt),
    })),
    deploys: deploys.map((d) => ({
      label: d.label,
      daysAgo: daysAgo(d.at),
      kind: d.kind,
    })),
    backups: backups.map((b) => ({ daysAgo: daysAgo(b.at), size: b.size })),
    incidents: incidents.map((i) => ({
      title: i.title,
      daysAgo: daysAgo(i.at),
      durationMin: i.durationMin,
    })),
    usage: r.usage as SiteHealth["usage"],
    registrar: r.registrar,
    domainRenewsInDays: Math.max(
      0,
      Math.round((ms(r.domain_renews_at) - Date.now()) / DAY),
    ),
    dns: r.dns as SiteHealth["dns"],
    trafficSources: (r.traffic_sources as SiteHealth["trafficSources"]) ?? [],
  };
}

/** Model -> row for sites (relative days become absolute timestamps). */
export function siteToRow(
  workspaceId: string,
  companyId: string,
  site: SiteHealth,
  now: number = Date.now(),
) {
  return {
    workspace_id: workspaceId,
    company_id: companyId,
    status: site.status,
    uptime_90d: site.uptime90d,
    ssl_days_left: site.sslDaysLeft,
    plan: site.plan,
    region: site.region,
    last_deploy_at: iso(now - site.lastDeployDaysAgo * DAY),
    visits_30d: site.visits30d,
    perf: site.perf as unknown as Json,
    pages: site.pages.map((p) => ({
      path: p.path,
      title: p.title,
      views30d: p.views30d,
      updatedAt: now - p.updatedDaysAgo * DAY,
    })) as unknown as Json,
    deploys: site.deploys.map((d) => ({
      label: d.label,
      at: now - d.daysAgo * DAY,
      kind: d.kind,
    })) as unknown as Json,
    backups: site.backups.map((b) => ({
      at: now - b.daysAgo * DAY,
      size: b.size,
    })) as unknown as Json,
    incidents: site.incidents.map((i) => ({
      title: i.title,
      at: now - i.daysAgo * DAY,
      durationMin: i.durationMin,
    })) as unknown as Json,
    usage: site.usage as unknown as Json,
    registrar: site.registrar,
    domain_renews_at: iso(now + site.domainRenewsInDays * DAY),
    dns: site.dns as unknown as Json,
    traffic_sources: site.trafficSources as unknown as Json,
  };
}

/* ------------------------------------------------------------------ */
/* Sorting conventions (mirror the demo store's newest-first prepends)  */
/* ------------------------------------------------------------------ */

const SORTERS: { [K in keyof CrmState]?: (a: never, b: never) => number } = {};

function byDesc<T>(key: (x: T) => number) {
  return (a: T, b: T) => key(b) - key(a);
}
function byAsc<T>(key: (x: T) => number) {
  return (a: T, b: T) => key(a) - key(b);
}

const sortState = (state: CrmState): CrmState => ({
  ...state,
  contacts: [...state.contacts].sort(byDesc((c) => c.createdAt)),
  leads: [...state.leads].sort(byDesc((l) => l.createdAt)),
  deals: [...state.deals].sort(byDesc((d) => d.createdAt)),
  tasks: [...state.tasks].sort(byDesc((t) => t.createdAt)),
  activities: [...state.activities].sort(byDesc((a) => a.at)),
  events: [...state.events].sort(byAsc((e) => e.startAt)),
  invoices: [...state.invoices].sort(byDesc((i) => i.issuedAt)),
  contracts: [...state.contracts].sort(byDesc((c) => c.sentAt)),
  tickets: [...state.tickets].sort(byDesc((t) => t.updatedAt)),
  deliverables: [...state.deliverables].sort(byDesc((d) => d.postedAt)),
  proposals: [...state.proposals].sort(byDesc((p) => p.updatedAt)),
  docs: [...state.docs].sort((a, b) => a.position - b.position),
  vault: [...state.vault].sort((a, b) => a.name.localeCompare(b.name)),
});
void SORTERS;

/* ------------------------------------------------------------------ */
/* Loader                                                              */
/* ------------------------------------------------------------------ */

export async function loadWorkspaceState(
  db: Db,
  workspaceId: string,
  userId: string,
): Promise<CrmState | null> {
  const ws = (q: string) => q; // readability marker
  void ws;

  const [
    workspaceRes,
    stagesRes,
    companiesRes,
    contactsRes,
    leadsRes,
    dealsRes,
    tasksRes,
    activitiesRes,
    eventsRes,
    invoicesRes,
    contractsRes,
    ticketsRes,
    ticketMessagesRes,
    deliverablesRes,
    entitlementsRes,
    rulesRes,
    membersRes,
    companyMembersRes,
    readRes,
    proposalsRes,
    docsRes,
    vaultRes,
    sitesRes,
    analyticsRes,
  ] = await Promise.all([
    db.from("workspaces").select("*").eq("id", workspaceId).maybeSingle(),
    db.from("stages").select("*").eq("workspace_id", workspaceId).order("position"),
    db.from("companies").select("*").eq("workspace_id", workspaceId),
    db.from("contacts").select("*").eq("workspace_id", workspaceId),
    db.from("leads").select("*").eq("workspace_id", workspaceId),
    db.from("deals").select("*").eq("workspace_id", workspaceId),
    db.from("tasks").select("*").eq("workspace_id", workspaceId),
    db
      .from("activities")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("at", { ascending: false })
      .limit(1000),
    db.from("events").select("*").eq("workspace_id", workspaceId),
    db.from("invoices").select("*").eq("workspace_id", workspaceId),
    db.from("contracts").select("*").eq("workspace_id", workspaceId),
    db.from("tickets").select("*").eq("workspace_id", workspaceId),
    db
      .from("ticket_messages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("at"),
    db.from("deliverables").select("*").eq("workspace_id", workspaceId),
    db.from("entitlements").select("*").eq("workspace_id", workspaceId),
    db.from("automation_rules").select("*").eq("workspace_id", workspaceId),
    db.from("workspace_members").select("*").eq("workspace_id", workspaceId),
    db.from("company_members").select("*").eq("workspace_id", workspaceId),
    db
      .from("read_notifications")
      .select("notif_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId),
    db.from("proposals").select("*").eq("workspace_id", workspaceId),
    db.from("doc_articles").select("*").eq("workspace_id", workspaceId),
    db.from("vault_items").select(VAULT_COLUMNS).eq("workspace_id", workspaceId),
    db.from("sites").select("*").eq("workspace_id", workspaceId),
    db.from("analytics_daily").select("*").eq("workspace_id", workspaceId).order("day"),
  ]);

  if (!workspaceRes.data) return null;

  const messagesByTicket = new Map<string, TicketMessage[]>();
  for (const m of ticketMessagesRes.data ?? []) {
    const list = messagesByTicket.get(m.ticket_id) ?? [];
    list.push(rowToTicketMessage(m));
    messagesByTicket.set(m.ticket_id, list);
  }

  const entitlements: Record<string, string[]> = {};
  for (const e of entitlementsRes.data ?? []) {
    entitlements[e.company_id] = e.tool_ids;
  }

  const team = await mapTeam(db, membersRes.data ?? []);
  const clientUsers = await mapClientUsers(db, companyMembersRes.data ?? []);

  const sites: Record<string, SiteHealth> = {};
  for (const s of sitesRes.data ?? []) sites[s.company_id] = rowToSite(s);

  const analytics: Record<string, AnalyticsDay[]> = {};
  for (const a of analyticsRes.data ?? []) {
    const list = analytics[a.company_id] ?? [];
    list.push({ at: ms(a.day), visits: a.visits, leads: a.leads });
    analytics[a.company_id] = list;
  }

  const workspace: Workspace = {
    id: workspaceRes.data.id,
    name: workspaceRes.data.name,
    plan: workspaceRes.data.plan as Workspace["plan"],
  };

  return sortState({
    workspace,
    stages: (stagesRes.data ?? []).map(rowToStage),
    companies: (companiesRes.data ?? []).map(rowToCompany),
    contacts: (contactsRes.data ?? []).map(rowToContact),
    leads: (leadsRes.data ?? []).map(rowToLead),
    deals: (dealsRes.data ?? []).map(rowToDeal),
    tasks: (tasksRes.data ?? []).map(rowToTask),
    activities: (activitiesRes.data ?? []).map(rowToActivity),
    events: (eventsRes.data ?? []).map(rowToEvent),
    invoices: (invoicesRes.data ?? []).map(rowToInvoice),
    contracts: (contractsRes.data ?? []).map(rowToContract),
    tickets: (ticketsRes.data ?? []).map((t) =>
      rowToTicket(t, messagesByTicket.get(t.id) ?? []),
    ),
    deliverables: (deliverablesRes.data ?? []).map(rowToDeliverable),
    entitlements,
    rules: (rulesRes.data ?? []).map(rowToRule),
    team,
    readNotifIds: (readRes.data ?? []).map((r) => r.notif_id),
    onboarded: true,
    ui: { openRequest: null },
    sites,
    analytics,
    vault: (vaultRes.data ?? []).map((v) => rowToVault(v as VaultRow)),
    docs: (docsRes.data ?? []).map(rowToDoc),
    proposals: (proposalsRes.data ?? []).map(rowToProposal),
    clientUsers,
  });
}

export async function mapTeam(
  db: Db,
  members: Tables<"workspace_members">[],
): Promise<TeamMember[]> {
  if (members.length === 0) return [];
  const { data: profiles } = await db
    .from("profiles")
    .select("*")
    .in("id", members.map((m) => m.user_id));
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const roleLabel: Record<string, TeamMember["role"]> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  };
  return members
    .map((m) => {
      const p = byId.get(m.user_id);
      return {
        id: m.user_id,
        name: p?.full_name || p?.email || "Teammate",
        email: p?.email ?? "",
        role: roleLabel[m.role] ?? "Member",
        hue: p?.hue ?? 160,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function mapClientUsers(
  db: Db,
  members: Tables<"company_members">[],
): Promise<ClientUser[]> {
  if (members.length === 0) return [];
  const { data: profiles } = await db
    .from("profiles")
    .select("*")
    .in("id", members.map((m) => m.user_id));
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return members.map((m) => {
    const p = byId.get(m.user_id);
    return {
      userId: m.user_id,
      companyId: m.company_id,
      name: p?.full_name || p?.email || "Client",
      email: p?.email ?? "",
    };
  });
}

/* ------------------------------------------------------------------ */
/* Realtime change application                                         */
/* ------------------------------------------------------------------ */

function upsertBy<T>(list: T[], item: T, id: (x: T) => string): T[] {
  const idx = list.findIndex((x) => id(x) === id(item));
  if (idx === -1) return [item, ...list];
  const next = [...list];
  next[idx] = item;
  return next;
}

function removeBy<T>(list: T[], itemId: string, id: (x: T) => string): T[] {
  return list.filter((x) => id(x) !== itemId);
}

export type ChangeResult = {
  state: CrmState;
  /** Membership/profile tables changed — the caller refetches team lists. */
  needsTeamRefresh: boolean;
};

export function applyChange(
  state: CrmState,
  table: string,
  eventType: "INSERT" | "UPDATE" | "DELETE",
  newRow: Record<string, unknown>,
  oldRow: Record<string, unknown>,
): ChangeResult {
  const ok = (s: CrmState): ChangeResult => ({ state: s, needsTeamRefresh: false });
  const del = eventType === "DELETE";
  const id = (del ? oldRow.id : newRow.id) as string;

  switch (table) {
    case "workspaces": {
      if (del) return ok(state);
      const r = newRow as Tables<"workspaces">;
      return ok({
        ...state,
        workspace: {
          id: r.id,
          name: r.name,
          plan: r.plan as Workspace["plan"],
        },
      });
    }
    case "stages": {
      const stages = del
        ? removeBy(state.stages, id, (s) => s.id)
        : upsertBy(state.stages, rowToStage(newRow as Tables<"stages">), (s) => s.id);
      return ok({
        ...state,
        stages: [...stages].sort(
          (a, b) =>
            ((a as Stage & { position?: number }).position ?? 0) -
            ((b as Stage & { position?: number }).position ?? 0),
        ),
      });
    }
    case "companies":
      return ok({
        ...state,
        companies: del
          ? removeBy(state.companies, id, (c) => c.id)
          : upsertBy(state.companies, rowToCompany(newRow as Tables<"companies">), (c) => c.id),
      });
    case "contacts":
      return ok({
        ...state,
        contacts: del
          ? removeBy(state.contacts, id, (c) => c.id)
          : upsertBy(state.contacts, rowToContact(newRow as Tables<"contacts">), (c) => c.id),
      });
    case "leads":
      return ok({
        ...state,
        leads: del
          ? removeBy(state.leads, id, (l) => l.id)
          : upsertBy(state.leads, rowToLead(newRow as Tables<"leads">), (l) => l.id).sort(
              (a, b) => b.createdAt - a.createdAt,
            ),
      });
    case "deals":
      return ok({
        ...state,
        deals: del
          ? removeBy(state.deals, id, (d) => d.id)
          : upsertBy(state.deals, rowToDeal(newRow as Tables<"deals">), (d) => d.id),
      });
    case "tasks":
      return ok({
        ...state,
        tasks: del
          ? removeBy(state.tasks, id, (t) => t.id)
          : upsertBy(state.tasks, rowToTask(newRow as Tables<"tasks">), (t) => t.id),
      });
    case "activities":
      return ok({
        ...state,
        activities: del
          ? removeBy(state.activities, id, (a) => a.id)
          : upsertBy(state.activities, rowToActivity(newRow as Tables<"activities">), (a) => a.id).sort(
              (a, b) => b.at - a.at,
            ),
      });
    case "events":
      return ok({
        ...state,
        events: del
          ? removeBy(state.events, id, (e) => e.id)
          : upsertBy(state.events, rowToEvent(newRow as Tables<"events">), (e) => e.id).sort(
              (a, b) => a.startAt - b.startAt,
            ),
      });
    case "invoices":
      return ok({
        ...state,
        invoices: del
          ? removeBy(state.invoices, id, (i) => i.id)
          : upsertBy(state.invoices, rowToInvoice(newRow as Tables<"invoices">), (i) => i.id).sort(
              (a, b) => b.issuedAt - a.issuedAt,
            ),
      });
    case "contracts":
      return ok({
        ...state,
        contracts: del
          ? removeBy(state.contracts, id, (c) => c.id)
          : upsertBy(state.contracts, rowToContract(newRow as Tables<"contracts">), (c) => c.id).sort(
              (a, b) => b.sentAt - a.sentAt,
            ),
      });
    case "tickets": {
      if (del) {
        return ok({ ...state, tickets: removeBy(state.tickets, id, (t) => t.id) });
      }
      const r = newRow as Tables<"tickets">;
      const existing = state.tickets.find((t) => t.id === r.id);
      const mapped = rowToTicket(r, existing?.messages ?? []);
      return ok({
        ...state,
        tickets: upsertBy(state.tickets, mapped, (t) => t.id).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        ),
      });
    }
    case "ticket_messages": {
      if (del) return ok(state);
      const r = newRow as Tables<"ticket_messages">;
      const message = rowToTicketMessage(r);
      return ok({
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === r.ticket_id && !t.messages.some((m) => m.id === message.id)
            ? { ...t, messages: [...t.messages, message] }
            : t,
        ),
      });
    }
    case "deliverables":
      return ok({
        ...state,
        deliverables: del
          ? removeBy(state.deliverables, id, (d) => d.id)
          : upsertBy(state.deliverables, rowToDeliverable(newRow as Tables<"deliverables">), (d) => d.id).sort(
              (a, b) => b.postedAt - a.postedAt,
            ),
      });
    case "entitlements": {
      const companyId = (del ? oldRow.company_id : newRow.company_id) as string;
      const entitlements = { ...state.entitlements };
      if (del) {
        delete entitlements[companyId];
      } else {
        entitlements[companyId] = (newRow as Tables<"entitlements">).tool_ids;
      }
      return ok({ ...state, entitlements });
    }
    case "automation_rules":
      return ok({
        ...state,
        rules: del
          ? removeBy(state.rules, id, (r) => r.id)
          : upsertBy(state.rules, rowToRule(newRow as Tables<"automation_rules">), (r) => r.id),
      });
    case "read_notifications": {
      if (del) return ok(state);
      const r = newRow as Tables<"read_notifications">;
      if (state.readNotifIds.includes(r.notif_id)) return ok(state);
      return ok({ ...state, readNotifIds: [...state.readNotifIds, r.notif_id] });
    }
    case "proposals":
      return ok({
        ...state,
        proposals: del
          ? removeBy(state.proposals, id, (p) => p.id)
          : upsertBy(state.proposals, rowToProposal(newRow as Tables<"proposals">), (p) => p.id).sort(
              (a, b) => b.updatedAt - a.updatedAt,
            ),
      });
    case "doc_articles":
      return ok({
        ...state,
        docs: del
          ? removeBy(state.docs, id, (d) => d.id)
          : upsertBy(state.docs, rowToDoc(newRow as Tables<"doc_articles">), (d) => d.id).sort(
              (a, b) => a.position - b.position,
            ),
      });
    case "vault_items":
      return ok({
        ...state,
        vault: del
          ? removeBy(state.vault, id, (v) => v.id)
          : upsertBy(state.vault, rowToVault(newRow as VaultRow), (v) => v.id).sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
      });
    case "sites": {
      const companyId = (del ? oldRow.company_id : newRow.company_id) as
        | string
        | undefined;
      if (!companyId) return ok(state);
      const sites = { ...state.sites };
      if (del) delete sites[companyId];
      else sites[companyId] = rowToSite(newRow as Tables<"sites">);
      return ok({ ...state, sites });
    }
    case "analytics_daily": {
      const r = (del ? oldRow : newRow) as Tables<"analytics_daily">;
      if (!r.company_id || !r.day) return ok(state);
      const at = ms(r.day);
      const analytics = { ...state.analytics };
      const list = (analytics[r.company_id] ?? []).filter((d) => d.at !== at);
      if (!del) list.push({ at, visits: r.visits, leads: r.leads });
      analytics[r.company_id] = list.sort((a, b) => a.at - b.at);
      return ok({ ...state, analytics });
    }
    case "workspace_members":
    case "company_members":
    case "profiles":
      return { state, needsTeamRefresh: true };
    default:
      return ok(state);
  }
}

/** Every table the realtime channel watches, keyed by workspace_id. */
export const REALTIME_TABLES = [
  "workspaces",
  "stages",
  "companies",
  "contacts",
  "leads",
  "deals",
  "tasks",
  "activities",
  "events",
  "invoices",
  "contracts",
  "tickets",
  "ticket_messages",
  "deliverables",
  "entitlements",
  "automation_rules",
  "read_notifications",
  "proposals",
  "doc_articles",
  "vault_items",
  "sites",
  "analytics_daily",
  "workspace_members",
  "company_members",
] as const;

/* ------------------------------------------------------------------ */
/* Bulk import (sample data, localStorage migration, backups)          */
/* ------------------------------------------------------------------ */

function chunk<T>(rows: T[], size = 200): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

async function insertAll<T extends keyof Database["public"]["Tables"]>(
  db: Db,
  table: T,
  rows: Database["public"]["Tables"][T]["Insert"][],
): Promise<void> {
  for (const batch of chunk(rows)) {
    if (batch.length === 0) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await db.from(table).insert(batch as any);
    if (error) throw new Error(`${String(table)}: ${error.message}`);
  }
}

/**
 * Insert a CrmState-shaped payload into a workspace, remapping every id to a
 * fresh uuid (legacy ids like "co-voyagr" aren't valid uuids). Used by
 * onboarding's sample data, the localStorage import and backup restore.
 * The caller refreshes state afterwards.
 */
export async function importWorkspaceData(
  db: Db,
  workspaceId: string,
  data: Partial<CrmState>,
  opts: { replaceStages?: boolean; demoVaultSecrets?: boolean } = {},
): Promise<void> {
  const idMap = new Map<string, string>();
  const remap = (oldId: string): string => {
    const existing = idMap.get(oldId);
    if (existing) return existing;
    const next = uid();
    idMap.set(oldId, next);
    return next;
  };
  const remapOrNull = (oldId: string | null | undefined): string | null =>
    oldId ? remap(oldId) : null;

  // Stages: optionally replace the workspace's current pipeline.
  if (data.stages && data.stages.length > 0) {
    if (opts.replaceStages) {
      // Deals referencing old stages cascade-delete; imports bring their own.
      const { error } = await db.from("stages").delete().eq("workspace_id", workspaceId);
      if (error) throw new Error(`stages: ${error.message}`);
    }
    const open = data.stages.filter((s) => s.kind === "open");
    const closed = data.stages.filter((s) => s.kind !== "open");
    await insertAll(
      db,
      "stages",
      [...open, ...closed].map((s, i) => ({
        id: remap(s.id),
        workspace_id: workspaceId,
        name: s.name,
        kind: s.kind,
        position: s.kind === "won" ? 100 : s.kind === "lost" ? 101 : i + 1,
      })),
    );
  }

  await insertAll(
    db,
    "companies",
    (data.companies ?? []).map((c) => ({
      id: remap(c.id),
      workspace_id: workspaceId,
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      location: c.location,
      is_client: c.isClient,
      notes: c.notes,
    })),
  );

  await insertAll(
    db,
    "contacts",
    (data.contacts ?? []).map((c) => ({
      id: remap(c.id),
      workspace_id: workspaceId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      role: c.role,
      company_id: remapOrNull(c.companyId),
      hue: c.hue,
      tags: c.tags,
      notes: c.notes,
      created_at: iso(c.createdAt),
    })),
  );

  await insertAll(
    db,
    "leads",
    (data.leads ?? []).map((l) => ({
      id: remap(l.id),
      workspace_id: workspaceId,
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
      last_contacted_at: isoOrNull(l.lastContactedAt),
      // Only link if the contact came along in the payload — a fabricated
      // uuid would trip the FK.
      converted_contact_id:
        l.convertedContactId && idMap.has(l.convertedContactId)
          ? remap(l.convertedContactId)
          : null,
      created_at: iso(l.createdAt),
    })),
  );

  await insertAll(
    db,
    "deals",
    (data.deals ?? []).map((d) => ({
      id: remap(d.id),
      workspace_id: workspaceId,
      name: d.name,
      company_id: remapOrNull(d.companyId),
      contact_id: remapOrNull(d.contactId),
      stage_id: remap(d.stageId),
      value: d.value,
      source: d.source,
      created_at: iso(d.createdAt),
      stage_changed_at: iso(d.stageChangedAt),
      closed_at: isoOrNull(d.closedAt),
    })),
  );

  await insertAll(
    db,
    "tasks",
    (data.tasks ?? []).map((t) => ({
      id: remap(t.id),
      workspace_id: workspaceId,
      title: t.title,
      due_at: iso(t.dueAt),
      done: t.done,
      deal_id: remapOrNull(t.dealId),
      contact_id: remapOrNull(t.contactId),
      created_at: iso(t.createdAt),
    })),
  );

  await insertAll(
    db,
    "activities",
    (data.activities ?? []).map((a) => ({
      id: remap(a.id),
      workspace_id: workspaceId,
      type: a.type,
      summary: a.summary,
      at: iso(a.at),
      deal_id: remapOrNull(a.dealId),
      contact_id: remapOrNull(a.contactId),
      company_id: remapOrNull(a.companyId),
      client_visible: a.clientVisible,
    })),
  );

  await insertAll(
    db,
    "events",
    (data.events ?? []).map((e) => ({
      id: remap(e.id),
      workspace_id: workspaceId,
      title: e.title,
      kind: e.kind,
      start_at: iso(e.startAt),
      duration_min: e.durationMin,
      deal_id: remapOrNull(e.dealId),
      contact_id: remapOrNull(e.contactId),
      notes: e.notes,
      done: e.done,
    })),
  );

  await insertAll(
    db,
    "invoices",
    (data.invoices ?? []).map((i) => ({
      id: remap(i.id),
      workspace_id: workspaceId,
      number: i.number,
      company_id: remap(i.companyId),
      deal_id: remapOrNull(i.dealId),
      label: i.label,
      amount: i.amount,
      issued_at: iso(i.issuedAt),
      due_at: iso(i.dueAt),
      paid_at: isoOrNull(i.paidAt),
      status: i.status,
    })),
  );

  await insertAll(
    db,
    "contracts",
    (data.contracts ?? []).map((c) => ({
      id: remap(c.id),
      workspace_id: workspaceId,
      company_id: remap(c.companyId),
      deal_id: remapOrNull(c.dealId),
      title: c.title,
      summary: c.summary,
      amount: c.amount,
      terms: c.terms,
      status: c.status,
      sent_at: iso(c.sentAt),
      viewed_at: isoOrNull(c.viewedAt),
      signed_at: isoOrNull(c.signedAt),
      signed_by: c.signedBy,
    })),
  );

  await insertAll(
    db,
    "tickets",
    (data.tickets ?? []).map((t) => ({
      id: remap(t.id),
      workspace_id: workspaceId,
      company_id: remap(t.companyId),
      contact_id: remapOrNull(t.contactId),
      topic: t.topic,
      subject: t.subject,
      status: t.status,
      created_at: iso(t.createdAt),
      updated_at: iso(t.updatedAt),
    })),
  );

  await insertAll(
    db,
    "ticket_messages",
    (data.tickets ?? []).flatMap((t) =>
      t.messages.map((m) => ({
        id: remap(m.id),
        ticket_id: remap(t.id),
        workspace_id: workspaceId,
        company_id: remap(t.companyId),
        from_side: m.from,
        author: m.author,
        body: m.text,
        at: iso(m.at),
      })),
    ),
  );

  await insertAll(
    db,
    "deliverables",
    (data.deliverables ?? []).map((d) => ({
      id: remap(d.id),
      workspace_id: workspaceId,
      company_id: remap(d.companyId),
      deal_id: remapOrNull(d.dealId),
      title: d.title,
      kind: d.kind,
      url: d.url,
      note: d.note,
      status: d.status,
      posted_at: iso(d.postedAt),
      responded_at: isoOrNull(d.respondedAt),
      client_comment: d.clientComment,
    })),
  );

  await insertAll(
    db,
    "entitlements",
    Object.entries(data.entitlements ?? {}).map(([companyId, toolIds]) => ({
      company_id: remap(companyId),
      workspace_id: workspaceId,
      tool_ids: toolIds,
    })),
  );

  await insertAll(
    db,
    "automation_rules",
    (data.rules ?? []).map((r) => ({
      id: remap(r.id),
      workspace_id: workspaceId,
      name: r.name,
      enabled: r.enabled,
      trigger: (r.trigger.type === "stage-enter"
        ? { type: "stage-enter", stageId: remap(r.trigger.stageId) }
        : r.trigger) as unknown as Json,
      action: r.action as unknown as Json,
    })),
  );

  await insertAll(
    db,
    "proposals",
    (data.proposals ?? []).map((p) => ({
      id: remap(p.id),
      workspace_id: workspaceId,
      title: p.title,
      company_id: remapOrNull(p.companyId),
      prepared_for: p.preparedFor,
      notes: p.notes,
      lines: p.lines as unknown as Json,
      global_discount_pct: p.globalDiscountPct,
      created_at: iso(p.createdAt),
      updated_at: iso(p.updatedAt),
    })),
  );

  // Docs upsert on slug — an import must not collide with the seeded library.
  for (const batch of chunk(
    (data.docs ?? []).map((d) => ({
      id: uid(),
      workspace_id: workspaceId,
      slug: d.slug,
      title: d.title,
      category: d.category,
      summary: d.summary,
      minutes: d.minutes,
      client_visible: d.clientVisible,
      sections: d.sections as unknown as Json,
      position: d.position,
      updated_at: iso(d.updatedAt),
    })),
  )) {
    if (batch.length === 0) continue;
    const { error } = await db
      .from("doc_articles")
      .upsert(batch, { onConflict: "workspace_id,slug", ignoreDuplicates: false });
    if (error) throw new Error(`doc_articles: ${error.message}`);
  }

  await insertAll(
    db,
    "sites",
    Object.entries(data.sites ?? {})
      .filter(([companyId]) => idMap.has(companyId))
      .map(([companyId, site]) => siteToRow(workspaceId, remap(companyId), site)),
  );

  await insertAll(
    db,
    "analytics_daily",
    Object.entries(data.analytics ?? {})
      .filter(([companyId]) => idMap.has(companyId))
      .flatMap(([companyId, days]) =>
        days.map((d) => ({
          company_id: remap(companyId),
          workspace_id: workspaceId,
          day: new Date(d.at).toISOString().slice(0, 10),
          visits: d.visits,
          leads: d.leads,
        })),
      ),
  );

  // Vault entries go through the RPC so secrets get encrypted server-side.
  for (const v of data.vault ?? []) {
    const secret = opts.demoVaultSecrets
      ? (DEMO_VAULT_SECRETS[v.id] ?? null)
      : null;
    const { error } = await db.rpc("save_vault_item", {
      p_id: null as unknown as string,
      p_workspace: workspaceId,
      p_company: remapOrNull(v.companyId) as unknown as string,
      p_name: v.name,
      p_category: v.category,
      p_username: v.username,
      p_url: v.url,
      p_secret: secret as unknown as string,
    });
    if (error) throw new Error(`vault: ${error.message}`);
  }

  // Keep the visible invoice numbering ahead of anything imported.
  const maxInvoice = (data.invoices ?? []).reduce((max, i) => {
    const n = Number(i.number.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  if (maxInvoice > 0) {
    await db.rpc("raise_invoice_seq", {
      p_workspace: workspaceId,
      p_seq: maxInvoice,
    });
  }
}

/** Default infrastructure for a company that just became a client. */
export async function ensureClientInfra(
  db: Db,
  workspaceId: string,
  company: Company,
  hasSite: boolean,
): Promise<void> {
  if (hasSite) return;
  const site = defaultSite(company);
  const { error } = await db
    .from("sites")
    .upsert(siteToRow(workspaceId, company.id, site), { onConflict: "company_id" });
  if (error) {
    console.error("ensureClientInfra sites:", error.message);
    return;
  }
  const { demoAnalytics } = await import("./seed");
  const days = demoAnalytics(company.id, site.visits30d);
  await db.from("analytics_daily").upsert(
    days.map((d) => ({
      company_id: company.id,
      workspace_id: workspaceId,
      day: new Date(d.at).toISOString().slice(0, 10),
      visits: d.visits,
      leads: d.leads,
    })),
    { onConflict: "company_id,day" },
  );
}
