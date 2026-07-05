import {
  FolderOpen,
  Globe,
  LifeBuoy,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import type { Company, CrmState } from "@/lib/crm/types";

/**
 * Client portal — domain model.
 *
 * The portal is the client-facing surface of the same CRM store the agency
 * works in: projects come from deals, updates from client-visible activities,
 * invoices from won deals. Entitlements decide which tools a client sees,
 * based on what they bought. Like the CRM, the shapes are backend-ready —
 * entitlements move onto the company record when a real database lands.
 */

export type PortalToolId = "website" | "projects" | "billing" | "support";

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
    description: "Your site's status, uptime, SSL and hosting",
  },
  {
    id: "projects",
    name: "Projects",
    href: "/portal/projects",
    icon: FolderOpen,
    description: "Active work, progress and updates from the team",
  },
  {
    id: "billing",
    name: "Billing",
    href: "/portal/billing",
    icon: Receipt,
    description: "Invoices and payment history",
  },
  {
    id: "support",
    name: "Support",
    href: "/portal/support",
    icon: LifeBuoy,
    description: "Send a request straight to your team",
  },
];

const ALL_TOOL_IDS = PORTAL_TOOLS.map((t) => t.id);

/**
 * What each seeded client bought. Clients created later in the CRM default
 * to the full toolset until entitlements are editable there.
 */
const SEED_ENTITLEMENTS: Record<string, PortalToolId[]> = {
  "co-voyagr": ["website", "projects", "billing", "support"],
  "co-northbeam": ["website", "billing", "support"],
};

export function entitlementsFor(company: Company): PortalToolId[] {
  return SEED_ENTITLEMENTS[company.id] ?? ALL_TOOL_IDS;
}

export function toolsFor(company: Company): PortalTool[] {
  const ids = entitlementsFor(company);
  return PORTAL_TOOLS.filter((t) => ids.includes(t.id));
}

/** Demo hosting/monitoring data for the Website tool. */
export type SiteHealth = {
  status: "online" | "maintenance";
  uptime90d: string;
  sslDaysLeft: number;
  plan: string;
  region: string;
  lastDeployDaysAgo: number;
  visits30d: number;
};

const SEED_SITES: Record<string, SiteHealth> = {
  "co-voyagr": {
    status: "online",
    uptime90d: "99.98%",
    sslDaysLeft: 71,
    plan: "Scale hosting",
    region: "us-east",
    lastDeployDaysAgo: 2,
    visits30d: 48_200,
  },
  "co-northbeam": {
    status: "online",
    uptime90d: "100%",
    sslDaysLeft: 54,
    plan: "WaaS subscription",
    region: "us-west",
    lastDeployDaysAgo: 9,
    visits30d: 6_400,
  },
};

export function siteHealthFor(company: Company): SiteHealth {
  return (
    SEED_SITES[company.id] ?? {
      status: "online",
      uptime90d: "99.95%",
      sslDaysLeft: 60,
      plan: "Managed hosting",
      region: "us-east",
      lastDeployDaysAgo: 5,
      visits30d: 3_100,
    }
  );
}

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

export type PortalInvoice = {
  id: string;
  label: string;
  amount: number;
  at: number;
  status: "paid" | "due";
};

/**
 * Mock invoices derived from deal history — won deals are paid in full,
 * a deal in negotiation shows its deposit as due. A real billing module
 * will replace this feed.
 */
export function invoicesFor(state: CrmState, companyId: string): PortalInvoice[] {
  const invoices: PortalInvoice[] = [];
  let n = 1042;
  for (const d of [...state.deals].reverse()) {
    if (d.companyId !== companyId) continue;
    const stage = state.stages.find((s) => s.id === d.stageId);
    if (stage?.kind === "won") {
      invoices.push({
        id: `INV-${n++}`,
        label: d.name,
        amount: d.value,
        at: d.closedAt ?? d.createdAt,
        status: "paid",
      });
    } else if (stage?.id === "negotiation") {
      invoices.push({
        id: `INV-${n++}`,
        label: `${d.name} — 50% deposit`,
        amount: Math.round(d.value / 2),
        at: d.stageChangedAt,
        status: "due",
      });
    }
  }
  return invoices.sort((a, b) => b.at - a.at);
}

/** Client-visible activity feed, newest first. */
export function updatesFor(state: CrmState, companyId: string) {
  return state.activities
    .filter((a) => a.companyId === companyId && a.clientVisible)
    .sort((a, b) => b.at - a.at);
}

export const SUPPORT_PREFIX = "Support request: ";

/** Requests this client submitted through the portal, newest first. */
export function requestsFor(state: CrmState, companyId: string) {
  return updatesFor(state, companyId)
    .filter((a) => a.summary.startsWith(SUPPORT_PREFIX))
    .map((a) => ({
      id: a.id,
      subject: a.summary.slice(SUPPORT_PREFIX.length),
      at: a.at,
    }));
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
