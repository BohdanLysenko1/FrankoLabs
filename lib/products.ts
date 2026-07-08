import {
  LayoutDashboard,
  Users,
  DoorOpen,
  Globe,
  Network,
  Server,
  ChartColumn,
  Receipt,
  FilePen,
  ListChecks,
  LifeBuoy,
  KeyRound,
  MailPlus,
  Sparkles,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "running" | "building" | "planned";

export type ProductModule = {
  /** URL segment under /products/. */
  slug: string;
  name: string;
  status: ModuleStatus;
  icon: LucideIcon;
  /** One-line pitch shown on cards and page headers. */
  tagline: string;
  /** Longer overview paragraph for the landing page. */
  overview: string;
  features: { title: string; description: string }[];
  /** Slugs of modules this one connects with. */
  worksWith: string[];
  /** Set once the module has a live app — adds a launch button. */
  liveUrl?: string;
};

export const statusStyle: Record<ModuleStatus, { dot: string; label: string }> =
  {
    running: { dot: "bg-accent", label: "running" },
    building: { dot: "bg-warn", label: "building" },
    planned: { dot: "bg-ink-faint", label: "planned" },
  };

/** The modules inside Franko OS. Order = display order on /products. */
export const productModules: ProductModule[] = [
  {
    slug: "dashboard",
    name: "Dashboard",
    status: "running",
    icon: LayoutDashboard,
    liveUrl: "/crm",
    tagline: "Your whole business on one screen.",
    overview:
      "The Dashboard is the home screen of Franko OS. It pulls live signals from every other module — traffic, leads, revenue, open tasks, site health — into a single view, so the first thing you see each morning is the state of the business, not fifteen browser tabs.",
    features: [
      {
        title: "Live system overview",
        description:
          "Traffic, pipeline, invoices and uptime rendered as one board that updates in real time.",
      },
      {
        title: "Module widgets",
        description:
          "Every installed module contributes its own widget. Add, remove and rearrange them to match how you work.",
      },
      {
        title: "Daily digest",
        description:
          "A morning summary of what changed overnight: new leads, paid invoices, deploys and anything that needs a decision.",
      },
    ],
    worksWith: ["analytics", "crm", "billing-invoices", "tasks"],
  },
  {
    slug: "crm",
    name: "CRM",
    status: "running",
    icon: Users,
    liveUrl: "/crm",
    tagline: "A pipeline that matches how you actually sell.",
    overview:
      "Most CRMs are built for enterprise sales teams and then forced onto small businesses. The Franko OS CRM starts from the other end: leads arrive from your website automatically, follow-ups are drafted for you, and every contact carries its full history — pages visited, emails opened, invoices paid.",
    features: [
      {
        title: "Automatic lead capture",
        description:
          "Forms, chat and email on your site feed straight into the pipeline. No copy-pasting, no lost leads.",
      },
      {
        title: "Full-context contacts",
        description:
          "Each contact shows site activity, conversations, projects and billing in one timeline.",
      },
      {
        title: "Follow-up automation",
        description:
          "Stale deals surface themselves and follow-up drafts are written for you by the AI Assistant.",
      },
      {
        title: "Pipeline reporting",
        description:
          "Conversion by source and stage, traced from first click to closed deal via Analytics.",
      },
    ],
    worksWith: ["email-automation", "ai-assistant", "analytics", "billing-invoices"],
  },
  {
    slug: "client-portal",
    name: "Client Portal",
    status: "building",
    icon: DoorOpen,
    liveUrl: "/login",
    tagline: "One login for everything you deliver to clients.",
    overview:
      "Clients shouldn't have to dig through email threads to find their invoice, their contract or the status of their project. The Client Portal gives each of your clients a branded login where everything you deliver — files, approvals, invoices, support — lives in one place.",
    features: [
      {
        title: "Branded client login",
        description:
          "Your logo, your domain, your design language. Clients see your brand, not ours.",
      },
      {
        title: "Project visibility",
        description:
          "Clients follow progress, review deliverables and approve work without another status-update email.",
      },
      {
        title: "Self-serve documents",
        description:
          "Invoices, contracts and files are always available — signed, paid and downloadable from one screen.",
      },
    ],
    worksWith: ["contracts", "billing-invoices", "support", "tasks"],
  },
  {
    slug: "website-management",
    name: "Website Management",
    status: "building",
    icon: Globe,
    liveUrl: "/crm/websites",
    tagline: "Edit, publish and monitor your site without a developer.",
    overview:
      "Website Management is mission control for your site. Change content, publish pages, and watch performance and uptime from the same panel — with every change versioned, previewable and instantly reversible.",
    features: [
      {
        title: "Visual content editing",
        description:
          "Update copy, images and pages in place. What you see in the editor is exactly what ships.",
      },
      {
        title: "Versioned publishing",
        description:
          "Every publish is a snapshot. Preview before it goes live, roll back in one click if it shouldn't have.",
      },
      {
        title: "Health monitoring",
        description:
          "Uptime, performance scores and broken-link checks run continuously and alert you before visitors notice.",
      },
    ],
    worksWith: ["hosting", "domains-dns", "analytics"],
  },
  {
    slug: "domains-dns",
    name: "Domains & DNS",
    status: "planned",
    icon: Network,
    liveUrl: "/crm/websites",
    tagline: "Domains, records and certificates without the registrar maze.",
    overview:
      "DNS is where good websites go to break. This module manages your domains, records and SSL certificates in plain language — and because it lives next to Hosting and Website Management, common setups are one-click instead of a support ticket.",
    features: [
      {
        title: "Domain management",
        description:
          "Register, transfer and renew domains in the same system that runs the sites on them.",
      },
      {
        title: "Guided DNS records",
        description:
          "Records explained in plain language, with one-click presets for mail, verification and subdomains.",
      },
      {
        title: "Automatic SSL",
        description:
          "Certificates issue and renew themselves. You'll never see an expiry warning on your own site.",
      },
    ],
    worksWith: ["hosting", "website-management"],
  },
  {
    slug: "hosting",
    name: "Hosting",
    status: "building",
    icon: Server,
    liveUrl: "/crm/websites",
    tagline: "Infrastructure you never have to think about.",
    overview:
      "Hosting runs your site on the same managed infrastructure that powers Franko Labs client work: global edge delivery, automatic backups and continuous monitoring. When something needs attention, it's usually fixed before you hear about it.",
    features: [
      {
        title: "Managed edge hosting",
        description:
          "Sites served from a global edge network — fast everywhere, with zero servers for you to maintain.",
      },
      {
        title: "Automatic backups",
        description:
          "Daily snapshots with one-click restore. A bad change is a minor annoyance, not a disaster.",
      },
      {
        title: "Proactive monitoring",
        description:
          "Uptime and error monitoring around the clock, with incidents surfaced straight to your Dashboard.",
      },
    ],
    worksWith: ["website-management", "domains-dns", "support"],
  },
  {
    slug: "analytics",
    name: "Analytics",
    status: "building",
    icon: ChartColumn,
    liveUrl: "/crm/reports",
    tagline: "Traffic, leads and revenue in one honest dashboard.",
    overview:
      "Analytics connects the numbers other tools keep separate. Because it shares data with your CRM and Billing, it doesn't stop at pageviews — it follows a visitor from first click to signed contract, so you know what actually makes you money.",
    features: [
      {
        title: "Full-funnel tracking",
        description:
          "See the path from traffic source to lead to paying client — not three disconnected reports.",
      },
      {
        title: "Privacy-friendly by default",
        description:
          "Cookieless, GDPR-conscious measurement that doesn't slow your site down or nag your visitors.",
      },
      {
        title: "Reports that read themselves",
        description:
          "Plain-language summaries of what changed and why, delivered to your Dashboard and inbox.",
      },
    ],
    worksWith: ["dashboard", "crm", "website-management"],
  },
  {
    slug: "billing-invoices",
    name: "Billing & Invoices",
    status: "planned",
    icon: Receipt,
    liveUrl: "/crm/billing",
    tagline: "Get paid without chasing.",
    overview:
      "Billing & Invoices turns getting paid into a background process. Invoices generate from your CRM deals and contracts, go out on schedule, chase themselves politely, and reconcile automatically when the money lands.",
    features: [
      {
        title: "One-click invoicing",
        description:
          "Invoices pre-filled from deals and contracts — send in seconds, branded and correct.",
      },
      {
        title: "Recurring billing",
        description:
          "Subscriptions and retainers bill themselves. Ideal for website-as-a-service and ongoing care plans.",
      },
      {
        title: "Automatic reminders",
        description:
          "Overdue invoices follow up on their own, so the awkward chasing email never has to come from you.",
      },
    ],
    worksWith: ["crm", "contracts", "client-portal"],
  },
  {
    slug: "contracts",
    name: "Contracts",
    status: "planned",
    icon: FilePen,
    liveUrl: "/crm/contracts",
    tagline: "From proposal to signature in one flow.",
    overview:
      "Contracts handles the paperwork between the handshake and the kickoff. Build proposals from templates, send them for legally-binding e-signature, and have the signed deal flow straight into Billing and Tasks — no PDF attachments, no printing.",
    features: [
      {
        title: "Reusable templates",
        description:
          "Proposals and agreements assembled from your own template library, priced from your services.",
      },
      {
        title: "E-signatures",
        description:
          "Clients sign from any device in the Client Portal. Status is tracked from sent to signed.",
      },
      {
        title: "Signed means started",
        description:
          "A signature can trigger the invoice, the project and the welcome email automatically.",
      },
    ],
    worksWith: ["client-portal", "billing-invoices", "crm"],
  },
  {
    slug: "tasks",
    name: "Tasks",
    status: "building",
    icon: ListChecks,
    liveUrl: "/crm/tasks",
    tagline: "Work tracking that lives where the work happens.",
    overview:
      "Tasks is project management wired into the rest of the system. Client requests become tasks, tasks link to the deals and sites they belong to, and progress is visible to clients through the Portal — without you writing a single status update.",
    features: [
      {
        title: "Connected tasks",
        description:
          "Every task links to its client, project and module, so context is never more than one click away.",
      },
      {
        title: "Boards and timelines",
        description:
          "Kanban for daily flow, timeline for planning. The same tasks, whichever view fits the moment.",
      },
      {
        title: "Client-visible progress",
        description:
          "Choose what clients can see in their Portal — progress updates itself as tasks move.",
      },
    ],
    worksWith: ["client-portal", "crm", "support"],
  },
  {
    slug: "support",
    name: "Support",
    status: "planned",
    icon: LifeBuoy,
    liveUrl: "/crm/support",
    tagline: "Every client request in one queue.",
    overview:
      "Support collects requests from email, the Client Portal and your site into one queue with history and accountability. No more issues buried in someone's inbox — every request has an owner, a status and a full paper trail.",
    features: [
      {
        title: "Unified inbox",
        description:
          "Email, portal messages and site forms land in one queue instead of five inboxes.",
      },
      {
        title: "Full client context",
        description:
          "Every ticket shows the client's sites, projects and history, so nobody asks questions twice.",
      },
      {
        title: "AI-drafted replies",
        description:
          "The AI Assistant drafts answers from your documentation and past tickets — you review and send.",
      },
    ],
    worksWith: ["client-portal", "ai-assistant", "documentation"],
  },
  {
    slug: "password-vault",
    name: "Password Vault",
    status: "planned",
    icon: KeyRound,
    liveUrl: "/crm/vault",
    tagline: "Client credentials, stored like they matter.",
    overview:
      "Agencies accumulate client credentials — hosting logins, DNS panels, ad accounts — and too often they live in spreadsheets and chat threads. The Password Vault stores them encrypted, shares them by role, and logs every access.",
    features: [
      {
        title: "End-to-end encryption",
        description:
          "Credentials are encrypted before they're stored. Nobody — including us — can read them without your key.",
      },
      {
        title: "Scoped sharing",
        description:
          "Grant access per client and per credential. Revoke in one click when a project or teammate rolls off.",
      },
      {
        title: "Access audit log",
        description:
          "Every view and change is logged, so you always know who touched what, and when.",
      },
    ],
    worksWith: ["client-portal", "hosting"],
  },
  {
    slug: "email-automation",
    name: "Email Automation",
    status: "planned",
    icon: MailPlus,
    liveUrl: "/crm/email",
    tagline: "Campaigns triggered by real behavior, not guesswork.",
    overview:
      "Email Automation sends the right message because it can see the whole system: what a contact did on your site, where their deal sits in the CRM, whether their invoice is paid. Sequences, broadcasts and lifecycle emails — all driven by real data.",
    features: [
      {
        title: "Behavior-triggered sequences",
        description:
          "Welcome flows, follow-ups and win-backs that fire on real events from your site and CRM.",
      },
      {
        title: "Broadcasts",
        description:
          "Newsletters and announcements to segments built from live CRM data, not stale exports.",
      },
      {
        title: "Revenue attribution",
        description:
          "Every send is traced through Analytics to leads and revenue — you'll know which emails pay rent.",
      },
    ],
    worksWith: ["crm", "analytics", "ai-assistant"],
  },
  {
    slug: "ai-assistant",
    name: "AI Assistant",
    status: "building",
    icon: Sparkles,
    liveUrl: "/crm/assistant",
    tagline: "An operator that knows your whole business.",
    overview:
      "The AI Assistant works across every module, with your business as its context. Ask it questions in plain language, or let it handle the repetitive work: drafting follow-ups, summarizing weeks, updating pages, triaging tickets — always with you approving the result.",
    features: [
      {
        title: "Ask your business anything",
        description:
          "\"Which leads went cold this month?\" — answered from live CRM, Analytics and Billing data.",
      },
      {
        title: "Drafts, not surprises",
        description:
          "Emails, replies and content are drafted for your review. The assistant proposes; you approve.",
      },
      {
        title: "Cross-module automations",
        description:
          "Describe a workflow in a sentence — \"when a contract is signed, invoice the deposit\" — and it's wired up.",
      },
    ],
    worksWith: ["crm", "support", "email-automation", "website-management"],
  },
  {
    slug: "documentation",
    name: "Documentation",
    status: "planned",
    icon: BookOpen,
    liveUrl: "/crm/docs",
    tagline: "The operating manual your business writes as it runs.",
    overview:
      "Documentation is the shared knowledge base for your team and your clients: processes, guides and answers, organized and searchable. It also feeds the AI Assistant and Support, so the answer you wrote once keeps answering.",
    features: [
      {
        title: "Team knowledge base",
        description:
          "Processes and internal docs with search that actually finds things.",
      },
      {
        title: "Client-facing guides",
        description:
          "Publish selected docs to the Client Portal, so common questions answer themselves.",
      },
      {
        title: "Powers your AI",
        description:
          "Everything you document becomes context for the AI Assistant and drafted support replies.",
      },
    ],
    worksWith: ["support", "ai-assistant", "client-portal"],
  },
];

export function getProductModule(slug: string): ProductModule | undefined {
  return productModules.find((m) => m.slug === slug);
}
