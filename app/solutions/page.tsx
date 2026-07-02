import type { Metadata } from "next";
import Link from "next/link";
import {
  Globe,
  PanelsTopLeft,
  Server,
  Users,
  Sparkles,
  Search,
  Megaphone,
  ChartColumn,
  Palette,
  MailPlus,
  ArrowRight,
} from "lucide-react";
import Window from "@/components/os/Window";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Agency services delivered as connected system modules: websites, hosting, CRM, AI automation, SEO, ads, analytics, branding and marketing.",
};

const services = [
  {
    id: "websites.waas",
    icon: Globe,
    name: "Website as a Service",
    description:
      "Design, build, hosting and maintenance for one monthly subscription. Your site stays fast, secure and current — forever.",
    tag: "subscription",
  },
  {
    id: "websites.custom",
    icon: PanelsTopLeft,
    name: "Custom Websites",
    description:
      "Fully custom sites engineered for performance and conversion, built on the same stack that powers Franko OS.",
    tag: "project",
  },
  {
    id: "infra.hosting",
    icon: Server,
    name: "Hosting & Maintenance",
    description:
      "Managed hosting with monitoring, backups, updates and same-day fixes. You never think about infrastructure again.",
    tag: "managed",
  },
  {
    id: "crm.setup",
    icon: Users,
    name: "CRM Setup",
    description:
      "A pipeline that actually matches how you sell. Lead capture, follow-ups and reporting wired into one place.",
    tag: "setup",
  },
  {
    id: "ai.automation",
    icon: Sparkles,
    name: "AI & Business Automation",
    description:
      "Automate intake, follow-ups, quotes and internal workflows with AI that works inside your existing tools.",
    tag: "automation",
  },
  {
    id: "growth.seo",
    icon: Search,
    name: "SEO",
    description:
      "Technical SEO, content structure and local search — measured by rankings and inbound leads, not vanity reports.",
    tag: "growth",
  },
  {
    id: "growth.ads",
    icon: Megaphone,
    name: "Google & Meta Ads",
    description:
      "Paid campaigns connected to your CRM, so every dollar is traceable from click to closed deal.",
    tag: "growth",
  },
  {
    id: "data.analytics",
    icon: ChartColumn,
    name: "Analytics",
    description:
      "One dashboard for traffic, leads and revenue. Know what works without opening five tools.",
    tag: "data",
  },
  {
    id: "brand.identity",
    icon: Palette,
    name: "Branding",
    description:
      "Logo, identity system and design language — consistent across your site, ads and every customer touchpoint.",
    tag: "design",
  },
  {
    id: "comms.marketing",
    icon: MailPlus,
    name: "Email & SMS Marketing",
    description:
      "Automated campaigns and broadcasts that bring customers back, triggered by real behavior in your CRM.",
    tag: "automation",
  },
];

export default function SolutionsPage() {
  return (
    <Window title="Solutions" path="~/solutions" size="lg">
      <div className="p-6 md:p-10">
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Our services
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Services that run as one system
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-dim">
          Every service below is a module in the same connected system. Start
          with one, or run the full stack — they share data, design and
          reporting.
        </p>

        <div className="mt-8 divide-y divide-edge rounded-2xl border border-edge bg-surface-2/40">
          {services.map((s) => (
            <div
              key={s.id}
              className="group flex items-start gap-5 p-5 transition hover:bg-surface-2/70"
            >
              <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface-3 text-ink-dim transition group-hover:text-accent">
                <s.icon className="size-6" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-medium">{s.name}</h3>
                <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink-dim">
                  {s.description}
                </p>
              </div>
              <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-xs text-ink-dim sm:flex">
                <span className="size-1.5 rounded-full bg-accent" />
                {s.tag}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-edge bg-accent-dim/50 p-6">
          <div>
            <p className="text-lg font-medium">Not sure where to start?</p>
            <p className="mt-1 text-[15px] text-ink-dim">
              Get a free audit of your current setup — we&apos;ll tell you what
              to fix first.
            </p>
          </div>
          <Link
            href="/contact?type=audit"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Request a free audit
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </Window>
  );
}
