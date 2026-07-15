"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FilePen, PackageOpen, Receipt, ShieldCheck } from "lucide-react";
import Widget from "@/components/os/Widget";
import { useCrm } from "@/lib/crm/store";
import {
  fmtDate,
  fmtMoney,
  invoiceBalance,
  relTime,
  type Company,
} from "@/lib/crm/types";
import {
  contractsFor,
  deliverablesFor,
  entitlementsFor,
  firstNameOf,
  invoicesFor,
  primaryContactFor,
  projectsFor,
  siteHealthFor,
  toolsFor,
  updatesFor,
} from "@/lib/portal/portal";

/**
 * The desktop a client sees at "/" once signed in — live widgets over their
 * data plus their entitled tools. The marketing hero never renders here.
 */
export default function ClientDesktop({ company }: { company: Company }) {
  const { state } = useCrm();
  const areaRef = useRef<HTMLDivElement>(null);
  const contact = primaryContactFor(state, company.id);
  const entitled = entitlementsFor(state, company);
  const tools = toolsFor(state, company);
  const site = siteHealthFor(state, company);
  const projects = projectsFor(state, company.id).filter(
    (p) => p.stageKind === "open",
  );
  const invoices = invoicesFor(state, company.id);
  const due = invoices.find((i) => i.status !== "paid");
  // Everything covered so far: full amounts on paid invoices, partials as-is.
  const paidTotal = invoices.reduce(
    (sum, i) => sum + (i.amount - invoiceBalance(i, state.payments)),
    0,
  );
  const updates = updatesFor(state, company.id);
  const pendingContract = entitled.includes("contracts")
    ? contractsFor(state, company.id).find((c) => c.status !== "signed")
    : undefined;
  const pendingDeliverable = entitled.includes("projects")
    ? deliverablesFor(state, company.id).find((d) => d.status === "in_review")
    : undefined;

  return (
    <div className="os-scroll h-full overflow-y-auto">
      <div
        ref={areaRef}
        className="mx-auto flex min-h-full max-w-5xl flex-col justify-center px-4 pb-36 pt-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
            <ShieldCheck className="size-3.5 text-accent" />
            {company.name} · client workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back{contact ? `, ${firstNameOf(contact.name)}` : ""}.
          </h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-ink-dim">
            Everything about your work with {state.workspace.name} — live from
            the same system the team runs on.
          </p>
        </motion.div>

        {(pendingContract || due || pendingDeliverable) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mb-5 grid gap-3 sm:grid-cols-2"
          >
            {pendingContract && (
              <Link
                href="/portal/contracts"
                className="group flex items-center gap-3.5 rounded-xl border border-accent/40 bg-accent-dim/50 p-4 transition hover:bg-accent-dim"
              >
                <FilePen className="size-5 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pendingContract.title}
                  </p>
                  <p className="text-xs text-ink-dim">
                    Waiting on your signature — takes a minute
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-ink-faint transition group-hover:text-accent" />
              </Link>
            )}
            {pendingDeliverable && (
              <Link
                href="/portal/projects"
                className="group flex items-center gap-3.5 rounded-xl border border-accent/40 bg-accent-dim/50 p-4 transition hover:bg-accent-dim"
              >
                <PackageOpen className="size-5 shrink-0 text-accent" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pendingDeliverable.title}
                  </p>
                  <p className="text-xs text-ink-dim">
                    Ready for your review — approve or request changes
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-ink-faint transition group-hover:text-accent" />
              </Link>
            )}
            {due && entitled.includes("billing") && (
              <Link
                href="/portal/billing"
                className="group flex items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-4 transition hover:border-edge-strong"
              >
                <Receipt className="size-5 shrink-0 text-warn" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {due.number} · {fmtMoney(due.amount)}
                  </p>
                  <p className="text-xs text-ink-dim">
                    Due {fmtDate(due.dueAt)} — pay in one click
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-ink-faint transition group-hover:text-accent" />
              </Link>
            )}
          </motion.div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {entitled.includes("website") && (
            <Widget constraintsRef={areaRef} name={`site.${company.domain}`} delay={0.1}>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="flex items-center justify-center gap-1.5 text-2xl font-semibold tabular-nums text-accent">
                    <span className="status-dot size-2 rounded-full bg-accent" />
                    {site.status === "online" ? "Live" : "Maint."}
                  </p>
                  <p className="mt-1 text-xs text-ink-dim">{company.domain}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {site.uptime90d}
                  </p>
                  <p className="mt-1 text-xs text-ink-dim">uptime · 90d</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {site.visits30d.toLocaleString("en-US")}
                  </p>
                  <p className="mt-1 text-xs text-ink-dim">visits · 30d</p>
                </div>
              </div>
              <Link
                href="/portal/website"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface-2/60 py-2 text-xs font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink"
              >
                Website & hosting details
                <ArrowRight className="size-3.5" />
              </Link>
            </Widget>
          )}

          {entitled.includes("projects") && (
            <Widget constraintsRef={areaRef} name="projects.active" delay={0.15}>
              <div className="space-y-4">
                {projects.slice(0, 2).map((p) => (
                  <div key={p.dealId}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="shrink-0 text-xs text-ink-dim">
                        {p.stageName.toLowerCase()}
                      </p>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="py-2 text-sm text-ink-dim">
                    No active projects — delivered work lives in Projects.
                  </p>
                )}
              </div>
              <Link
                href="/portal/projects"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface-2/60 py-2 text-xs font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink"
              >
                All projects & updates
                <ArrowRight className="size-3.5" />
              </Link>
            </Widget>
          )}

          {entitled.includes("billing") && (
            <Widget constraintsRef={areaRef} name="billing.summary" delay={0.2}>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p
                    className={`text-2xl font-semibold tabular-nums ${
                      due ? "text-warn" : "text-accent"
                    }`}
                  >
                    {due ? fmtMoney(due.amount) : "$0"}
                  </p>
                  <p className="mt-1 text-xs text-ink-dim">
                    {due ? `due · ${fmtDate(due.dueAt)}` : "nothing due"}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {fmtMoney(paidTotal)}
                  </p>
                  <p className="mt-1 text-xs text-ink-dim">paid to date</p>
                </div>
              </div>
              <Link
                href="/portal/billing"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-surface-2/60 py-2 text-xs font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink"
              >
                Invoices & history
                <ArrowRight className="size-3.5" />
              </Link>
            </Widget>
          )}

          <Widget constraintsRef={areaRef} name="updates.feed" delay={0.25}>
            <ul className="space-y-2.5">
              {updates.slice(0, 4).map((u) => (
                <li
                  key={u.id}
                  className="flex items-start gap-2.5 text-base leading-relaxed text-ink-dim"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="min-w-0">
                    <span className="line-clamp-2">{u.summary}</span>
                    <span className="text-xs text-ink-dim">
                      {relTime(u.at)}
                    </span>
                  </span>
                </li>
              ))}
              {updates.length === 0 && (
                <li className="py-2 text-sm text-ink-dim">
                  Updates from the team will appear here.
                </li>
              )}
            </ul>
          </Widget>

          <Widget constraintsRef={areaRef} name="tools.installed" delay={0.3} className="md:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tools.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="group rounded-xl border border-edge bg-surface-2/60 p-4 transition hover:border-edge-strong hover:bg-surface-3"
                >
                  <t.icon
                    className="mb-3 size-6 text-ink-dim transition group-hover:text-accent"
                    strokeWidth={1.75}
                  />
                  <p className="text-[15px] font-medium">{t.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-dim">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}
