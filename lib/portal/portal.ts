import {
  ChartColumn,
  FilePen,
  FolderOpen,
  Globe,
  KeyRound,
  LifeBuoy,
  Network,
  Receipt,
  Server,
  Sparkles,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type {
  AnalyticsDay,
  Company,
  CrmState,
  SiteHealth,
  VaultEntry,
} from "@/lib/crm/types";
import { defaultSite, demoAnalytics, hashId } from "@/lib/crm/seed";

/**
 * Client portal — domain model.
 *
 * The portal is the client-facing surface of the same CRM store the agency
 * works in: projects come from deals, invoices/contracts/tickets are
 * first-class store records, updates come from client-visible activities.
 * Sites, vault items and analytics live in the store too — seeded fixtures in
 * demo mode, database rows when signed in. Entitlements (editable from the
 * CRM's Portal view) decide which tools a client sees.
 */

export type PortalToolId =
  | "website"
  | "hosting"
  | "domains"
  | "projects"
  | "analytics"
  | "billing"
  | "contracts"
  | "support"
  | "guides"
  | "vault"
  | "assistant";

export type PortalTool = {
  id: PortalToolId;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Every tool the portal can offer. Order = dock order. */
export const PORTAL_TOOLS: PortalTool[] = [
  {
    id: "website",
    name: "Website",
    href: "/portal/website",
    icon: Globe,
    description: "Pages, deploys and performance of your site",
  },
  {
    id: "hosting",
    name: "Hosting",
    href: "/portal/hosting",
    icon: Server,
    description: "Plan, usage, backups and incident history",
  },
  {
    id: "domains",
    name: "Domains",
    href: "/portal/domains",
    icon: Network,
    description: "Your domain, DNS records and SSL certificate",
  },
  {
    id: "projects",
    name: "Projects",
    href: "/portal/projects",
    icon: FolderOpen,
    description: "Active work, progress and updates from the team",
  },
  {
    id: "analytics",
    name: "Analytics",
    href: "/portal/analytics",
    icon: ChartColumn,
    description: "Traffic, top pages and where your leads come from",
  },
  {
    id: "billing",
    name: "Billing",
    href: "/portal/billing",
    icon: Receipt,
    description: "Invoices, payments and open balance",
  },
  {
    id: "contracts",
    name: "Contracts",
    href: "/portal/contracts",
    icon: FilePen,
    description: "Proposals and agreements — review and sign",
  },
  {
    id: "support",
    name: "Support",
    href: "/portal/support",
    icon: LifeBuoy,
    description: "Requests, replies and their status",
  },
  {
    id: "guides",
    name: "Guides",
    href: "/portal/guides",
    icon: BookOpen,
    description: "How-tos and answers written for you",
  },
  {
    id: "vault",
    name: "Vault",
    href: "/portal/vault",
    icon: KeyRound,
    description: "Credentials the team shares with you, encrypted",
  },
  {
    id: "assistant",
    name: "Assistant",
    href: "/portal/assistant",
    icon: Sparkles,
    description: "Ask anything about your projects, invoices or site",
  },
];

const ALL_TOOL_IDS = PORTAL_TOOLS.map((t) => t.id);

/**
 * What this client bought. Entitlements live in the CRM store (edited from
 * the Portal view). Fail-closed: a company without a record gets NO tools —
 * the owner grants exactly what was paid for. The database enforces the same
 * rule (app.client_has_tool in RLS), so this is presentation, not security.
 */
export function entitlementsFor(
  state: CrmState,
  company: Company,
): PortalToolId[] {
  const saved = state.entitlements[company.id];
  if (!saved) return [];
  return ALL_TOOL_IDS.filter((id) => saved.includes(id));
}

export function toolsFor(state: CrmState, company: Company): PortalTool[] {
  const ids = entitlementsFor(state, company);
  return PORTAL_TOOLS.filter((t) => ids.includes(t.id));
}

/* ------------------------------------------------------------------ */
/* Managed site, vault & analytics — store-backed                      */
/* ------------------------------------------------------------------ */

export function siteHealthFor(state: CrmState, company: Company): SiteHealth {
  return state.sites[company.id] ?? defaultSite(company);
}

export function vaultFor(state: CrmState, companyId: string): VaultEntry[] {
  return state.vault.filter((v) => v.companyId === companyId);
}

export type AnalyticsData = {
  /** 30 daily points, oldest first. */
  days: AnalyticsDay[];
  totals: { visits: number; leads: number; conversion: string };
  /** Percent change vs the previous 30 days. */
  deltas: { visits: number; leads: number };
  sources: { name: string; share: number }[];
  topPages: { path: string; views: number }[];
  funnel: { label: string; value: number }[];
};

/** Small deterministic jitter so derived numbers stay stable per company. */
function jitter(companyId: string, salt: number): number {
  return ((hashId(`${companyId}:${salt}`) % 1000) / 1000);
}

export function analyticsFor(state: CrmState, company: Company): AnalyticsData {
  const site = siteHealthFor(state, company);
  const days =
    state.analytics[company.id] ?? demoAnalytics(company.id, site.visits30d);

  let visits = 0;
  let leads = 0;
  for (const day of days) {
    visits += day.visits;
    leads += day.leads;
  }

  const prev = Math.round(visits / (1.06 + jitter(company.id, 1) * 0.18));
  const prevLeads = Math.max(
    1,
    Math.round(leads / (1.04 + jitter(company.id, 2) * 0.3)),
  );

  let sources = site.trafficSources;
  if (sources.length === 0) {
    const shares = [
      38 + jitter(company.id, 3) * 10,
      24 + jitter(company.id, 4) * 8,
      14 + jitter(company.id, 5) * 6,
      8 + jitter(company.id, 6) * 4,
    ];
    const rest = 100 - shares.reduce((a, b) => a + b, 0);
    sources = [
      { name: "Organic search", share: Math.round(shares[0]) },
      { name: "Direct", share: Math.round(shares[1]) },
      { name: "Social", share: Math.round(shares[2]) },
      { name: "Referrals", share: Math.round(shares[3]) },
      { name: "Other", share: Math.max(1, Math.round(rest)) },
    ];
  }

  return {
    days,
    totals: {
      visits,
      leads,
      conversion: `${((leads / Math.max(1, visits)) * 100).toFixed(1)}%`,
    },
    deltas: {
      visits: prev > 0 ? Math.round(((visits - prev) / prev) * 100) : 0,
      leads: Math.round(((leads - prevLeads) / prevLeads) * 100),
    },
    sources,
    topPages: site.pages
      .slice()
      .sort((a, b) => b.views30d - a.views30d)
      .map((p) => ({ path: p.path, views: p.views30d })),
    funnel: [
      { label: "Visitors", value: visits },
      { label: "Engaged (2+ pages)", value: Math.round(visits * 0.42) },
      { label: "Leads", value: leads },
      { label: "Conversations", value: Math.max(1, Math.round(leads * 0.55)) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Store-backed feeds                                                  */
/* ------------------------------------------------------------------ */

export type PortalProject = {
  dealId: string;
  name: string;
  stageName: string;
  stageKind: "open" | "won" | "lost";
  progress: number;
  startedAt: number;
  deliveredAt: number | null;
};

export function projectsFor(state: CrmState, companyId: string): PortalProject[] {
  const openStages = state.stages.filter((s) => s.kind === "open");
  return state.deals
    .filter((d) => d.companyId === companyId)
    .map((d) => {
      const stage = state.stages.find((s) => s.id === d.stageId);
      const stageIdx = openStages.findIndex((s) => s.id === d.stageId);
      const progress =
        stage?.kind === "won"
          ? 100
          : stage?.kind === "lost"
            ? 0
            : Math.round(((stageIdx + 1) / (openStages.length + 1)) * 100);
      return {
        dealId: d.id,
        name: d.name,
        stageName: stage?.name ?? "In progress",
        stageKind: stage?.kind ?? "open",
        progress,
        startedAt: d.createdAt,
        deliveredAt: d.closedAt,
      };
    })
    .filter((p) => p.stageKind !== "lost")
    .sort((a, b) => b.startedAt - a.startedAt);
}

export function invoicesFor(state: CrmState, companyId: string) {
  return state.invoices
    .filter((i) => i.companyId === companyId)
    .sort((a, b) => b.issuedAt - a.issuedAt);
}

export function paymentsFor(state: CrmState, companyId: string) {
  return state.payments
    .filter((p) => p.companyId === companyId)
    .sort((a, b) => b.paidOn - a.paidOn);
}

export function contractsFor(state: CrmState, companyId: string) {
  return state.contracts
    .filter((c) => c.companyId === companyId)
    .sort((a, b) => b.sentAt - a.sentAt);
}

export function deliverablesFor(state: CrmState, companyId: string) {
  return state.deliverables
    .filter((d) => d.companyId === companyId)
    .sort((a, b) => b.postedAt - a.postedAt);
}

export function ticketsFor(state: CrmState, companyId: string) {
  return state.tickets
    .filter((t) => t.companyId === companyId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Dock badge counts — things waiting on the client's action, derived fresh
 * each render: due invoices, unsigned contracts, deliverables in review,
 * ticket threads where the team spoke last.
 */
export function toolBadgesFor(
  state: CrmState,
  company: Company,
): Partial<Record<PortalToolId, number>> {
  const billing = state.invoices.filter(
    (i) => i.companyId === company.id && i.status !== "paid",
  ).length;
  const contracts = state.contracts.filter(
    (c) => c.companyId === company.id && c.status !== "signed",
  ).length;
  const projects = state.deliverables.filter(
    (d) => d.companyId === company.id && d.status === "in_review",
  ).length;
  const support = state.tickets.filter(
    (t) =>
      t.companyId === company.id &&
      t.status !== "resolved" &&
      t.messages[t.messages.length - 1]?.from === "agency",
  ).length;
  const badges: Partial<Record<PortalToolId, number>> = {};
  if (billing > 0) badges.billing = billing;
  if (contracts > 0) badges.contracts = contracts;
  if (projects > 0) badges.projects = projects;
  if (support > 0) badges.support = support;
  return badges;
}

/** Client-visible activity feed, newest first. */
export function updatesFor(state: CrmState, companyId: string) {
  return state.activities
    .filter((a) => a.companyId === companyId && a.clientVisible)
    .sort((a, b) => b.at - a.at);
}

/** The person the portal greets — first contact at the company. */
export function primaryContactFor(state: CrmState, companyId: string) {
  return state.contacts.find((c) => c.companyId === companyId) ?? null;
}

/** First name for greetings — skips honorifics so "Dr. Sarah W." greets Sarah. */
export function firstNameOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  return words.find((w) => !/^(dr|mr|mrs|ms|mx|prof)\.?$/i.test(w)) ?? words[0];
}
