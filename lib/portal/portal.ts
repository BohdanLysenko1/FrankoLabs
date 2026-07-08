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
import type { Company, CrmState } from "@/lib/crm/types";

/**
 * Client portal — domain model.
 *
 * The portal is the client-facing surface of the same CRM store the agency
 * works in: projects come from deals, invoices/contracts/tickets are
 * first-class store records, updates come from client-visible activities.
 * Entitlements live in the store (editable from the CRM's Portal view) and
 * decide which tools a client sees. Site, domain, vault and analytics data
 * are deterministic demo fixtures until real integrations land.
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
 * the Portal view); companies without a record default to the full toolset.
 */
export function entitlementsFor(
  state: CrmState,
  company: Company,
): PortalToolId[] {
  const saved = state.entitlements[company.id];
  if (!saved) return ALL_TOOL_IDS;
  return ALL_TOOL_IDS.filter((id) => saved.includes(id));
}

export function toolsFor(state: CrmState, company: Company): PortalTool[] {
  const ids = entitlementsFor(state, company);
  return PORTAL_TOOLS.filter((t) => ids.includes(t.id));
}

/* ------------------------------------------------------------------ */
/* Website, hosting & domain fixtures                                  */
/* ------------------------------------------------------------------ */

export type SitePage = {
  path: string;
  title: string;
  views30d: number;
  updatedDaysAgo: number;
};

export type Deploy = {
  label: string;
  daysAgo: number;
  kind: "content" | "feature" | "fix";
};

export type Incident = {
  title: string;
  daysAgo: number;
  durationMin: number;
};

export type DnsRecord = {
  type: "A" | "CNAME" | "MX" | "TXT";
  name: string;
  value: string;
  note: string;
};

export type SiteHealth = {
  status: "online" | "maintenance";
  uptime90d: string;
  sslDaysLeft: number;
  plan: string;
  region: string;
  lastDeployDaysAgo: number;
  visits30d: number;
  /** Lighthouse-style scores, 0–100. */
  perf: { performance: number; accessibility: number; seo: number };
  pages: SitePage[];
  deploys: Deploy[];
  /** Daily snapshots — days ago, newest first. */
  backups: { daysAgo: number; size: string }[];
  incidents: Incident[];
  usage: {
    bandwidthGb: number;
    bandwidthLimitGb: number;
    storageGb: number;
    storageLimitGb: number;
  };
  registrar: string;
  domainRenewsInDays: number;
  dns: DnsRecord[];
};

function defaultSite(company: Company): SiteHealth {
  return {
    status: "online",
    uptime90d: "99.95%",
    sslDaysLeft: 60,
    plan: "Managed hosting",
    region: "us-east",
    lastDeployDaysAgo: 5,
    visits30d: 3_100,
    perf: { performance: 94, accessibility: 97, seo: 96 },
    pages: [
      { path: "/", title: "Home", views30d: 1_900, updatedDaysAgo: 5 },
      { path: "/about", title: "About", views30d: 640, updatedDaysAgo: 21 },
      { path: "/contact", title: "Contact", views30d: 410, updatedDaysAgo: 21 },
    ],
    deploys: [
      { label: "Content refresh", daysAgo: 5, kind: "content" },
      { label: "Initial launch", daysAgo: 40, kind: "feature" },
    ],
    backups: [
      { daysAgo: 0, size: "84 MB" },
      { daysAgo: 1, size: "84 MB" },
      { daysAgo: 2, size: "83 MB" },
    ],
    incidents: [],
    usage: {
      bandwidthGb: 4,
      bandwidthLimitGb: 100,
      storageGb: 1.2,
      storageLimitGb: 10,
    },
    registrar: "Franko Labs (via Cloudflare)",
    domainRenewsInDays: 200,
    dns: [
      { type: "A", name: "@", value: "76.76.21.21", note: "Points your domain at the site" },
      { type: "CNAME", name: "www", value: `${company.domain}.`, note: "www works too" },
      { type: "MX", name: "@", value: "route.mx.cloudflare.net", note: "Delivers your email" },
    ],
  };
}

const SEED_SITES: Record<string, Partial<SiteHealth>> = {
  "co-voyagr": {
    status: "online",
    uptime90d: "99.98%",
    sslDaysLeft: 71,
    plan: "Scale hosting",
    region: "us-east",
    lastDeployDaysAgo: 2,
    visits30d: 48_200,
    perf: { performance: 97, accessibility: 98, seo: 95 },
    pages: [
      { path: "/", title: "Home", views30d: 21_400, updatedDaysAgo: 2 },
      { path: "/destinations", title: "Destinations", views30d: 11_800, updatedDaysAgo: 9 },
      { path: "/booking", title: "Book a trip", views30d: 8_600, updatedDaysAgo: 2 },
      { path: "/stories", title: "Traveler stories", views30d: 3_900, updatedDaysAgo: 16 },
      { path: "/about", title: "About Voyagr", views30d: 2_500, updatedDaysAgo: 30 },
    ],
    deploys: [
      { label: "Booking flow copy + seasonal banner", daysAgo: 2, kind: "content" },
      { label: "Itinerary preview cards", daysAgo: 9, kind: "feature" },
      { label: "Safari date-picker fix", daysAgo: 14, kind: "fix" },
      { label: "Destination pages batch 3", daysAgo: 23, kind: "content" },
    ],
    backups: [
      { daysAgo: 0, size: "412 MB" },
      { daysAgo: 1, size: "411 MB" },
      { daysAgo: 2, size: "409 MB" },
      { daysAgo: 3, size: "402 MB" },
    ],
    incidents: [
      { title: "Elevated response times during traffic spike", daysAgo: 26, durationMin: 14 },
    ],
    usage: {
      bandwidthGb: 132,
      bandwidthLimitGb: 500,
      storageGb: 6.8,
      storageLimitGb: 50,
    },
    domainRenewsInDays: 244,
    dns: [
      { type: "A", name: "@", value: "76.76.21.21", note: "Points voyagr.app at the site" },
      { type: "CNAME", name: "www", value: "voyagr.app.", note: "www works too" },
      { type: "CNAME", name: "book", value: "booking.voyagr.app.", note: "Booking subdomain" },
      { type: "MX", name: "@", value: "route.mx.cloudflare.net", note: "Delivers your email" },
      { type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all", note: "Email anti-spoofing" },
    ],
  },
  "co-northbeam": {
    status: "online",
    uptime90d: "100%",
    sslDaysLeft: 54,
    plan: "WaaS subscription",
    region: "us-west",
    lastDeployDaysAgo: 8,
    visits30d: 6_400,
    perf: { performance: 96, accessibility: 99, seo: 98 },
    pages: [
      { path: "/", title: "Home", views30d: 2_700, updatedDaysAgo: 8 },
      { path: "/new-patients", title: "New patients", views30d: 1_450, updatedDaysAgo: 8 },
      { path: "/locations", title: "Locations & hours", views30d: 1_100, updatedDaysAgo: 8 },
      { path: "/services/implants", title: "Dental implants", views30d: 620, updatedDaysAgo: 34 },
    ],
    deploys: [
      { label: "Holiday hours banner removed", daysAgo: 8, kind: "content" },
      { label: "New-patient form shortened", daysAgo: 19, kind: "feature" },
      { label: "Location pages schema markup", daysAgo: 33, kind: "fix" },
    ],
    backups: [
      { daysAgo: 0, size: "96 MB" },
      { daysAgo: 1, size: "96 MB" },
      { daysAgo: 2, size: "96 MB" },
    ],
    incidents: [],
    usage: {
      bandwidthGb: 11,
      bandwidthLimitGb: 100,
      storageGb: 1.9,
      storageLimitGb: 10,
    },
    domainRenewsInDays: 121,
  },
  "co-bloom": {
    status: "online",
    uptime90d: "99.99%",
    sslDaysLeft: 80,
    plan: "WaaS subscription",
    region: "us-east",
    lastDeployDaysAgo: 6,
    visits30d: 2_150,
    perf: { performance: 98, accessibility: 96, seo: 94 },
    pages: [
      { path: "/", title: "Home", views30d: 1_150, updatedDaysAgo: 6 },
      { path: "/shop", title: "Shop arrangements", views30d: 540, updatedDaysAgo: 6 },
      { path: "/weddings", title: "Weddings & events", views30d: 260, updatedDaysAgo: 28 },
    ],
    deploys: [
      { label: "Summer collection homepage refresh", daysAgo: 6, kind: "content" },
      { label: "Initial WaaS launch", daysAgo: 30, kind: "feature" },
    ],
    incidents: [],
    domainRenewsInDays: 310,
  },
};

export function siteHealthFor(company: Company): SiteHealth {
  return { ...defaultSite(company), ...SEED_SITES[company.id] };
}

/* ------------------------------------------------------------------ */
/* Vault fixtures                                                      */
/* ------------------------------------------------------------------ */

export type VaultItem = {
  id: string;
  name: string;
  category: "hosting" | "domain" | "marketing" | "analytics";
  username: string;
  /** Demo secret — a real vault decrypts client-side. */
  secret: string;
  url: string;
  lastAccessDaysAgo: number;
};

const SEED_VAULT: Record<string, VaultItem[]> = {
  "co-voyagr": [
    {
      id: "vl-1",
      name: "Google Business Profile",
      category: "marketing",
      username: "hello@voyagr.app",
      secret: "vygr-GBP-2093!x",
      url: "https://business.google.com",
      lastAccessDaysAgo: 3,
    },
    {
      id: "vl-2",
      name: "Meta Ads account",
      category: "marketing",
      username: "ads@voyagr.app",
      secret: "vygr-Meta-7741#q",
      url: "https://business.facebook.com",
      lastAccessDaysAgo: 6,
    },
    {
      id: "vl-3",
      name: "Booking engine admin",
      category: "hosting",
      username: "admin@voyagr.app",
      secret: "vygr-Book-1189$z",
      url: "https://admin.voyagr.app",
      lastAccessDaysAgo: 1,
    },
  ],
};

const FALLBACK_VAULT: VaultItem[] = [
  {
    id: "vl-a",
    name: "Google Business Profile",
    category: "marketing",
    username: "owner@yourbusiness.com",
    secret: "demo-GBP-0000!x",
    url: "https://business.google.com",
    lastAccessDaysAgo: 4,
  },
  {
    id: "vl-b",
    name: "Domain registrar",
    category: "domain",
    username: "owner@yourbusiness.com",
    secret: "demo-DNS-0000#q",
    url: "https://dash.cloudflare.com",
    lastAccessDaysAgo: 12,
  },
];

export function vaultFor(company: Company): VaultItem[] {
  return SEED_VAULT[company.id] ?? FALLBACK_VAULT;
}

/* ------------------------------------------------------------------ */
/* Analytics fixtures                                                  */
/* ------------------------------------------------------------------ */

export type AnalyticsData = {
  /** 30 daily points, oldest first. */
  days: { at: number; visits: number; leads: number }[];
  totals: { visits: number; leads: number; conversion: string };
  /** Percent change vs the previous 30 days. */
  deltas: { visits: number; leads: number };
  sources: { name: string; share: number }[];
  topPages: { path: string; views: number }[];
  funnel: { label: string; value: number }[];
};

/** Deterministic PRNG so a company's numbers are stable across renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DAY_MS = 86_400_000;

export function analyticsFor(company: Company): AnalyticsData {
  const site = siteHealthFor(company);
  const rand = mulberry32(hashId(company.id));
  const daily = site.visits30d / 30;
  // Anchor days to local midnight so charts don't shift within a day.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: AnalyticsData["days"] = [];
  let visits = 0;
  let leads = 0;
  for (let i = 29; i >= 0; i--) {
    const at = today.getTime() - i * DAY_MS;
    const weekday = new Date(at).getDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.62 : 1;
    const trend = 0.85 + ((29 - i) / 29) * 0.3; // gently up and to the right
    const v = Math.max(1, Math.round(daily * weekendDip * trend * (0.75 + rand() * 0.5)));
    const l = Math.round(v * (0.015 + rand() * 0.02));
    days.push({ at, visits: v, leads: l });
    visits += v;
    leads += l;
  }

  const prev = Math.round(visits / (1.06 + rand() * 0.18));
  const prevLeads = Math.max(1, Math.round(leads / (1.04 + rand() * 0.3)));

  const shares = [38 + rand() * 10, 24 + rand() * 8, 14 + rand() * 6, 8 + rand() * 4];
  const rest = 100 - shares.reduce((a, b) => a + b, 0);

  return {
    days,
    totals: {
      visits,
      leads,
      conversion: `${((leads / Math.max(1, visits)) * 100).toFixed(1)}%`,
    },
    deltas: {
      visits: Math.round(((visits - prev) / prev) * 100),
      leads: Math.round(((leads - prevLeads) / prevLeads) * 100),
    },
    sources: [
      { name: "Organic search", share: Math.round(shares[0]) },
      { name: "Direct", share: Math.round(shares[1]) },
      { name: "Social", share: Math.round(shares[2]) },
      { name: "Referrals", share: Math.round(shares[3]) },
      { name: "Other", share: Math.max(1, Math.round(rest)) },
    ],
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
    (i) => i.companyId === company.id && i.status === "due",
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
