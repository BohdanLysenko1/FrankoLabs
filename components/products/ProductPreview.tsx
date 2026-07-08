"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MonitorPlay, X } from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import type { Company } from "@/lib/crm/types";
import { playSound } from "@/lib/sound";

/**
 * "Launch preview" on every /products/[slug] page. Opens the module's real
 * view — the same component the CRM or client portal renders — inside an
 * OS-style window over the sample workspace. One source of truth: the demo
 * can never drift from the product.
 */

const demoLoading = () => (
  <div className="flex h-64 items-center justify-center text-sm text-ink-faint">
    Loading module…
  </div>
);

// Agency-side views (no props).
const DashboardView = dynamic(() => import("@/components/crm/DashboardView"), { ssr: false, loading: demoLoading });
const PipelineView = dynamic(() => import("@/components/crm/PipelineView"), { ssr: false, loading: demoLoading });
const WebsitesView = dynamic(() => import("@/components/crm/WebsitesView"), { ssr: false, loading: demoLoading });
const BillingView = dynamic(() => import("@/components/crm/BillingView"), { ssr: false, loading: demoLoading });
const ContractsView = dynamic(() => import("@/components/crm/ContractsView"), { ssr: false, loading: demoLoading });
const TasksView = dynamic(() => import("@/components/crm/TasksView"), { ssr: false, loading: demoLoading });
const SupportView = dynamic(() => import("@/components/crm/SupportView"), { ssr: false, loading: demoLoading });
const VaultView = dynamic(() => import("@/components/crm/VaultView"), { ssr: false, loading: demoLoading });
const EmailView = dynamic(() => import("@/components/crm/EmailView"), { ssr: false, loading: demoLoading });
const AssistantView = dynamic(() => import("@/components/crm/AssistantView"), { ssr: false, loading: demoLoading });
const DocsView = dynamic(() => import("@/components/crm/DocsView"), { ssr: false, loading: demoLoading });

// Client-portal tools (take the demo company).
const ClientDesktop = dynamic(() => import("@/components/portal/ClientDesktop"), { ssr: false, loading: demoLoading });
const HostingTool = dynamic(
  () => import("@/components/portal/tools-infra").then((m) => m.HostingTool),
  { ssr: false, loading: demoLoading },
);
const DomainsTool = dynamic(
  () => import("@/components/portal/tools-infra").then((m) => m.DomainsTool),
  { ssr: false, loading: demoLoading },
);
const AnalyticsTool = dynamic(
  () => import("@/components/portal/tools-infra").then((m) => m.AnalyticsTool),
  { ssr: false, loading: demoLoading },
);

const AGENCY_VIEWS: Record<string, ComponentType> = {
  dashboard: DashboardView,
  crm: PipelineView,
  "website-management": WebsitesView,
  "billing-invoices": BillingView,
  contracts: ContractsView,
  tasks: TasksView,
  support: SupportView,
  "password-vault": VaultView,
  "email-automation": EmailView,
  "ai-assistant": AssistantView,
  documentation: DocsView,
};

const PORTAL_VIEWS: Record<string, ComponentType<{ company: Company }>> = {
  "client-portal": ClientDesktop,
  hosting: HostingTool,
  "domains-dns": DomainsTool,
  analytics: AnalyticsTool,
};

function DemoBody({ slug }: { slug: string }) {
  const { state } = useCrm();
  const Agency = AGENCY_VIEWS[slug];
  if (Agency) return <Agency />;

  const Portal = PORTAL_VIEWS[slug];
  const demoCompany =
    state.companies.find((c) => c.isClient) ?? state.companies[0];
  if (Portal && demoCompany) return <Portal company={demoCompany} />;

  return (
    <div className="flex h-64 items-center justify-center text-sm text-ink-faint">
      Preview coming soon.
    </div>
  );
}

export default function ProductPreview({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const isPortalView = slug in PORTAL_VIEWS;

  const launch = () => {
    playSound("open");
    setOpen(true);
  };
  const close = () => {
    playSound("close");
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playSound("close");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={launch}
        className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-2 px-6 py-3 text-base font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink"
      >
        <MonitorPlay className="size-5" />
        Launch preview
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-8"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-edge bg-desktop shadow-2xl shadow-black/70"
            >
              <div className="flex shrink-0 items-center gap-3 border-b border-edge bg-surface/80 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={close}
                    aria-label="Close preview"
                    className="group flex size-3 items-center justify-center rounded-full bg-danger"
                  >
                    <X className="size-2 opacity-0 transition group-hover:opacity-100" />
                  </button>
                  <span className="size-3 rounded-full bg-warn/70" />
                  <span className="size-3 rounded-full bg-accent/70" />
                </div>
                <p className="min-w-0 flex-1 truncate text-center text-sm font-medium">
                  {name}
                  <span className="ml-2 font-mono text-xs text-ink-faint">
                    ~/preview/{slug}
                  </span>
                </p>
                <span className="shrink-0 rounded-full border border-accent/30 bg-accent-dim px-2.5 py-1 text-[11px] font-medium text-accent">
                  {isPortalView ? "client view · sample data" : "live · sample data"}
                </span>
              </div>
              <div className="os-scroll min-h-0 flex-1 overflow-y-auto bg-desktop">
                <DemoBody slug={slug} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
