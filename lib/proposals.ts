import { uid } from "./crm/types";

/**
 * Proposal builder — the service catalog (the Solutions list, priced),
 * pricing math and localStorage draft persistence. Drafts convert into
 * contracts through the CRM store's sendContract action.
 */

export type ServiceBilling = "one-time" | "monthly";

export type CatalogService = {
  id: string;
  name: string;
  description: string;
  billing: ServiceBilling;
  basePrice: number;
  /** What one unit means, e.g. "project", "month", "hour". */
  unit: string;
};

export const SERVICE_CATALOG: CatalogService[] = [
  {
    id: "waas",
    name: "Website as a Service",
    description: "Design, build, hosting and maintenance in one subscription.",
    billing: "monthly",
    basePrice: 249,
    unit: "month",
  },
  {
    id: "custom-website",
    name: "Custom Website",
    description: "Fully custom site engineered for performance and conversion.",
    billing: "one-time",
    basePrice: 6800,
    unit: "project",
  },
  {
    id: "hosting",
    name: "Hosting",
    description: "Managed edge hosting with SSL, backups and monitoring.",
    billing: "monthly",
    basePrice: 49,
    unit: "month",
  },
  {
    id: "maintenance",
    name: "Website Maintenance",
    description: "Updates, content changes and security patches handled.",
    billing: "monthly",
    basePrice: 129,
    unit: "month",
  },
  {
    id: "crm-setup",
    name: "CRM Setup",
    description: "Pipeline, automations and data migration, ready on day one.",
    billing: "one-time",
    basePrice: 1900,
    unit: "project",
  },
  {
    id: "ai-automation",
    name: "AI Automation",
    description: "AI assistants and automations wired into your workflows.",
    billing: "one-time",
    basePrice: 2400,
    unit: "project",
  },
  {
    id: "workflow-automation",
    name: "Workflow Automation",
    description: "Manual busywork replaced with connected, automated flows.",
    billing: "one-time",
    basePrice: 1600,
    unit: "project",
  },
  {
    id: "seo",
    name: "SEO",
    description: "Monthly technical, content and local search program.",
    billing: "monthly",
    basePrice: 750,
    unit: "month",
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description: "Campaign build, management and conversion tracking.",
    billing: "monthly",
    basePrice: 600,
    unit: "month",
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    description: "Creative, audiences and optimization across Meta platforms.",
    billing: "monthly",
    basePrice: 600,
    unit: "month",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Tracking, dashboards and reporting that lead with revenue.",
    billing: "one-time",
    basePrice: 900,
    unit: "setup",
  },
  {
    id: "branding",
    name: "Branding",
    description: "Identity, logo system and brand guidelines.",
    billing: "one-time",
    basePrice: 2800,
    unit: "project",
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    description: "Campaigns, flows and list growth, written and managed.",
    billing: "monthly",
    basePrice: 450,
    unit: "month",
  },
  {
    id: "sms-marketing",
    name: "SMS Marketing",
    description: "Compliant SMS campaigns and automations.",
    billing: "monthly",
    basePrice: 350,
    unit: "month",
  },
  {
    id: "consulting",
    name: "Technical Consulting",
    description: "Architecture, tooling and roadmap guidance on demand.",
    billing: "one-time",
    basePrice: 160,
    unit: "hour",
  },
];

export const serviceById = new Map(SERVICE_CATALOG.map((s) => [s.id, s]));

export type ProposalLine = {
  serviceId: string;
  qty: number;
  unitPrice: number;
  /** Per-line discount, 0–100. */
  discountPct: number;
};

export type Proposal = {
  id: string;
  title: string;
  companyId: string | null;
  preparedFor: string;
  notes: string;
  lines: ProposalLine[];
  /** Applied on top of line discounts, 0–100. */
  globalDiscountPct: number;
  createdAt: number;
  updatedAt: number;
};

export type ProposalTotals = {
  oneTimeSubtotal: number;
  monthlySubtotal: number;
  oneTime: number;
  monthly: number;
  /** Total knocked off by line + global discounts. */
  discount: number;
  /** One-time total plus the first month of recurring services. */
  firstInvoice: number;
};

const clampPct = (pct: number) => Math.min(100, Math.max(0, pct));

export function lineTotal(line: ProposalLine): number {
  const qty = Math.max(0, line.qty);
  const price = Math.max(0, line.unitPrice);
  return Math.round(qty * price * (1 - clampPct(line.discountPct) / 100));
}

export function proposalTotals(
  proposal: Pick<Proposal, "lines" | "globalDiscountPct">,
): ProposalTotals {
  let oneTimeSubtotal = 0;
  let monthlySubtotal = 0;
  let listPrice = 0;
  for (const line of proposal.lines) {
    const service = serviceById.get(line.serviceId);
    if (!service) continue;
    listPrice += Math.round(Math.max(0, line.qty) * Math.max(0, line.unitPrice));
    if (service.billing === "monthly") monthlySubtotal += lineTotal(line);
    else oneTimeSubtotal += lineTotal(line);
  }
  const factor = 1 - clampPct(proposal.globalDiscountPct) / 100;
  const oneTime = Math.round(oneTimeSubtotal * factor);
  const monthly = Math.round(monthlySubtotal * factor);
  return {
    oneTimeSubtotal,
    monthlySubtotal,
    oneTime,
    monthly,
    discount: listPrice - oneTime - monthly,
    firstInvoice: oneTime + monthly,
  };
}

export function emptyProposal(): Proposal {
  const now = Date.now();
  return {
    id: uid(),
    title: "New proposal",
    companyId: null,
    preparedFor: "",
    notes: "",
    lines: [],
    globalDiscountPct: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/** Human-facing document number, e.g. "FL-2026-4F2A". */
export function proposalNumber(proposal: Proposal): string {
  const year = new Date(proposal.createdAt).getFullYear();
  const tail = proposal.id.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  return `FL-${year}-${tail || "0000"}`;
}

const STORAGE_KEY = "franko-proposals-v1";

export function loadProposals(): Proposal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? (list as Proposal[]) : [];
  } catch {
    return [];
  }
}

export function saveProposals(proposals: Proposal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
  } catch {
    // Storage full or unavailable — drafts keep working in-memory.
  }
}
