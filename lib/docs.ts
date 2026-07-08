/**
 * Documentation module — the shared knowledge base. Internal docs power the
 * agency's Docs view; articles marked clientVisible publish into the client
 * portal's Guides tool. Static content until a real editor lands.
 */

export type DocSection = { heading?: string; text: string };

export type DocArticle = {
  slug: string;
  title: string;
  category: "Getting started" | "Website" | "Billing" | "Playbooks" | "Runbooks";
  summary: string;
  minutes: number;
  updatedDaysAgo: number;
  /** Published to the client portal's Guides tool. */
  clientVisible: boolean;
  sections: DocSection[];
};

export const docArticles: DocArticle[] = [
  {
    slug: "portal-getting-started",
    title: "Getting the most from your client portal",
    category: "Getting started",
    summary:
      "A five-minute tour of your portal — where projects, invoices, support and your website's health all live.",
    minutes: 5,
    updatedDaysAgo: 12,
    clientVisible: true,
    sections: [
      {
        text: "Your portal is the same system our team runs on — you're seeing your slice of it, live. Nothing here is a status report someone wrote after the fact; it's the actual state of your projects, invoices and website.",
      },
      {
        heading: "The desktop",
        text: "The home screen shows what needs your attention first: anything due, anything waiting on your signature, and the latest updates from the team. Every tool in your dock opens in its own window.",
      },
      {
        heading: "When something needs doing",
        text: "Invoices can be paid right from Billing. Contracts are signed in Contracts — no printing, no PDF attachments. If you need a change on your site, send it through Support and it lands directly in the team's queue.",
      },
    ],
  },
  {
    slug: "requesting-changes",
    title: "How to request website changes",
    category: "Website",
    summary:
      "Send a change request in under a minute — and what happens on our side once you do.",
    minutes: 3,
    updatedDaysAgo: 20,
    clientVisible: true,
    sections: [
      {
        text: "Open Support, pick \"Website change\", and describe what you'd like changed. Links, screenshots and deadlines all help. That's it — no email thread needed.",
      },
      {
        heading: "What happens next",
        text: "Your request becomes a ticket in our production queue with your site's full context attached. You'll see its status change from open to in progress to resolved, with our replies in the thread. Most content changes ship within two business days.",
      },
    ],
  },
  {
    slug: "understanding-invoices",
    title: "Invoices, deposits and payment",
    category: "Billing",
    summary:
      "How invoicing works: deposits on signature, monthly subscriptions, and paying from the portal.",
    minutes: 4,
    updatedDaysAgo: 30,
    clientVisible: true,
    sections: [
      {
        text: "Project work invoices a 50% deposit when a contract is signed, with the balance due on delivery. Subscriptions (like Website-as-a-Service and retainers) bill monthly and appear in Billing a few days before their due date.",
      },
      {
        heading: "Paying an invoice",
        text: "Open Billing, find the invoice marked \"due\", and hit Pay. You'll get a receipt in your updates feed, and the team sees the payment instantly — nobody has to ask anybody whether the transfer landed.",
      },
    ],
  },
  {
    slug: "dns-in-plain-language",
    title: "Your domain and DNS, in plain language",
    category: "Website",
    summary:
      "What those records in the Domains tool actually do, and why you almost never need to touch them.",
    minutes: 4,
    updatedDaysAgo: 45,
    clientVisible: true,
    sections: [
      {
        text: "Your domain is your address; DNS records are the signposts that point it at the right servers. The A record points your domain at your website. CNAME records make variants like www work. MX records deliver your email. TXT records prove ownership and stop spoofing.",
      },
      {
        heading: "Who manages what",
        text: "We manage all of it — registration, renewal, records and the SSL certificate that keeps the padlock in your visitors' browsers. The Domains tool shows you everything read-only, so you always know the state of your own infrastructure.",
      },
    ],
  },
  {
    slug: "client-onboarding-sop",
    title: "New client onboarding SOP",
    category: "Playbooks",
    summary:
      "The first-week checklist: portal invite, entitlements, kickoff, vault handover and DNS audit.",
    minutes: 6,
    updatedDaysAgo: 15,
    clientVisible: false,
    sections: [
      {
        text: "Run this within 48 hours of a signed contract. 1) Mark the company as a client — their portal switches on. 2) Set entitlements to match what they bought. 3) Send the portal invite from the Portal view. 4) Create the kickoff event. 5) Collect credentials into the Vault. 6) Audit DNS before pointing anything at our hosting.",
      },
      {
        heading: "Why entitlements first",
        text: "The portal is the product demo that never ends. A client who sees tools they didn't buy files it under clutter; a client who sees exactly their slice trusts every number on the screen.",
      },
    ],
  },
  {
    slug: "monthly-seo-process",
    title: "Monthly SEO retainer process",
    category: "Playbooks",
    summary:
      "The recurring cycle behind every SEO retainer: audit, publish, build, report.",
    minutes: 7,
    updatedDaysAgo: 22,
    clientVisible: false,
    sections: [
      {
        text: "Week 1: technical crawl and Search Console review. Week 2: publish or refresh two content pieces. Week 3: internal linking and local citations. Week 4: report from Analytics — always lead with bookings and revenue, never rankings.",
      },
    ],
  },
  {
    slug: "hosting-incident-runbook",
    title: "Hosting incident runbook",
    category: "Runbooks",
    summary:
      "Who does what when uptime monitoring fires — triage, comms, rollback, postmortem.",
    minutes: 5,
    updatedDaysAgo: 60,
    clientVisible: false,
    sections: [
      {
        text: "1) Acknowledge the alert within 5 minutes. 2) Check the edge status page before assuming it's us. 3) If a deploy is suspect, roll back first and debug after. 4) Post a client-visible update if downtime exceeds 15 minutes. 5) Log the incident on the site record — it feeds the client's Hosting tool, and honesty there is a feature.",
      },
    ],
  },
  {
    slug: "site-launch-checklist",
    title: "Site launch checklist",
    category: "Runbooks",
    summary:
      "The pre-flight list every launch goes through: DNS, SSL, redirects, analytics, backups, monitoring.",
    minutes: 4,
    updatedDaysAgo: 38,
    clientVisible: false,
    sections: [
      {
        text: "DNS TTL lowered 24h ahead. SSL issued and verified. 301 map tested against the old sitemap. Analytics and lead capture firing on staging. First backup snapshot taken. Uptime monitor pointed at the new origin. Client portal Website tool checked — the client sees the launch land in their deploy feed.",
      },
    ],
  },
];

export function getDocArticle(slug: string): DocArticle | undefined {
  return docArticles.find((a) => a.slug === slug);
}

export const clientGuides = docArticles.filter((a) => a.clientVisible);
