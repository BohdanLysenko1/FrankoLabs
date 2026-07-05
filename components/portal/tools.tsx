"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Globe,
  Receipt,
  Rocket,
  Send,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import {
  DAY,
  fmtDate,
  fmtMoney,
  relTime,
  type Company,
} from "@/lib/crm/types";
import {
  SUPPORT_PREFIX,
  invoicesFor,
  primaryContactFor,
  projectsFor,
  requestsFor,
  siteHealthFor,
  updatesFor,
} from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";

/** The four portal tool windows. Each renders inside <PortalGate>. */

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-edge bg-surface-2/60 p-4">
      <p className={`text-xl font-semibold tabular-nums ${accent ? "text-accent" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-dim">{label}</p>
    </div>
  );
}

export function WebsiteTool({ company }: { company: Company }) {
  const site = siteHealthFor(company);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Globe className="size-8 text-accent" strokeWidth={1.5} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {company.domain}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-ink-dim">
              <span className="status-dot size-1.5 rounded-full bg-accent" />
              {site.status === "online" ? "All systems online" : "Maintenance window"}
              · {site.plan}
            </p>
          </div>
        </div>
        <a
          href={`https://${company.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-edge bg-surface-2 px-4 py-2 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
        >
          Visit site ↗
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="uptime · last 90 days" value={site.uptime90d} accent />
        <Stat label="visits · last 30 days" value={site.visits30d.toLocaleString("en-US")} />
        <Stat label="hosting region" value={site.region} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-4">
          <ShieldCheck className="size-6 shrink-0 text-accent" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">SSL certificate</p>
            <p className="text-xs text-ink-dim">
              Valid — auto-renews in {site.sslDaysLeft} days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-4">
          <Rocket className="size-6 shrink-0 text-ink-dim" strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">Last deploy</p>
            <p className="text-xs text-ink-dim">
              {site.lastDeployDaysAgo === 0
                ? "today"
                : `${site.lastDeployDaysAgo} days ago`}{" "}
              · monitored around the clock
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface-2/60 p-5">
        <div>
          <p className="text-sm font-medium">Need a change on the site?</p>
          <p className="text-xs text-ink-dim">
            Content edits, new pages, campaigns — send it over and it lands
            straight in the team&apos;s queue.
          </p>
        </div>
        <Link
          href="/portal/support"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
        >
          Request a change
        </Link>
      </div>
    </div>
  );
}

export function ProjectsTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const projects = projectsFor(state, company.id);
  const updates = updatesFor(state, company.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Your projects</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Live from {state.workspace.name}&apos;s production board.
        </p>
      </div>

      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p.dealId} className="rounded-xl border border-edge bg-surface-2/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[15px] font-medium">{p.name}</p>
              <span
                className={`flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-xs ${
                  p.stageKind === "won" ? "text-accent" : "text-ink-dim"
                }`}
              >
                {p.stageKind === "won" ? (
                  <>
                    <CheckCircle2 className="size-3.5" /> delivered
                  </>
                ) : (
                  <>
                    <span className="status-dot size-1.5 rounded-full bg-accent" />
                    {p.stageName.toLowerCase()}
                  </>
                )}
              </span>
            </div>
            <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${p.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Started {fmtDate(p.startedAt)}
              {p.deliveredAt ? ` · delivered ${fmtDate(p.deliveredAt)}` : ""}
            </p>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="rounded-xl border border-edge bg-surface-2/60 p-6 text-sm text-ink-faint">
            No projects yet.
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Updates from the team
        </p>
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {updates.slice(0, 6).map((u) => (
            <div key={u.id} className="flex items-start gap-3 p-4">
              <FileText className="mt-0.5 size-4 shrink-0 text-ink-faint" />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{u.summary}</p>
                <p className="mt-1 text-xs text-ink-faint">{relTime(u.at)}</p>
              </div>
            </div>
          ))}
          {updates.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">
              Updates from the team will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BillingTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const invoices = invoicesFor(state, company.id);
  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const dueTotal = invoices
    .filter((i) => i.status === "due")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Invoices & billing
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          Payment history for your work with {state.workspace.name}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="open balance" value={fmtMoney(dueTotal)} accent={dueTotal === 0} />
        <Stat label="paid to date" value={fmtMoney(paidTotal)} />
      </div>

      <div className="divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3.5 p-4">
            <Receipt className="size-4 shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{inv.id}</p>
              <p className="truncate text-xs text-ink-faint">{inv.label}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm tabular-nums">
                {fmtMoney(inv.amount)}
              </p>
              <p
                className={`text-[11px] font-medium ${
                  inv.status === "paid" ? "text-accent" : "text-warn"
                }`}
              >
                {inv.status === "paid"
                  ? `paid · ${fmtDate(inv.at)}`
                  : `due · ${fmtDate(inv.at)}`}
              </p>
            </div>
          </div>
        ))}
        {invoices.length === 0 && (
          <p className="p-5 text-sm text-ink-faint">No invoices yet.</p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-faint">
        A question about an invoice?{" "}
        <Link href="/portal/support" className="text-accent hover:underline">
          Send the team a message
        </Link>
        .
      </p>
    </div>
  );
}

const REQUEST_TOPICS = [
  "Website change",
  "New work",
  "Billing question",
  "Something else",
];

export function SupportTool({ company }: { company: Company }) {
  const { state, actions } = useCrm();
  const contact = primaryContactFor(state, company.id);
  const requests = requestsFor(state, company.id);

  const [topic, setTopic] = useState(REQUEST_TOPICS[0]);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const line = subject.trim();
    if (!line) return;
    // The round trip: the request lands in the agency's CRM as a task to
    // work and an update the client can see in their own feed.
    actions.addTask(
      `${topic}: ${line} (${company.name})`,
      Date.now() + DAY,
      { contactId: contact?.id ?? null },
    );
    actions.logActivity({
      type: "note",
      summary: `${SUPPORT_PREFIX}${line}${details.trim() ? ` — ${details.trim()}` : ""}`,
      companyId: company.id,
      contactId: contact?.id ?? null,
      clientVisible: true,
    });
    playSound("open");
    setSubject("");
    setDetails("");
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Support</h1>
        <p className="mt-1 text-sm text-ink-dim">
          Requests go straight into {state.workspace.name}&apos;s queue —
          replies within one business day.
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-accent/30 bg-accent-dim p-8 text-center">
          <CheckCircle2 className="size-8 text-accent" strokeWidth={1.5} />
          <div>
            <p className="text-[15px] font-medium">Request received</p>
            <p className="mt-1 text-sm text-ink-dim">
              It&apos;s in the team&apos;s queue — you&apos;ll hear back within
              one business day.
            </p>
          </div>
          <button
            onClick={() => setSent(false)}
            className="rounded-xl border border-edge bg-surface px-4 py-2 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REQUEST_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  topic === t
                    ? "border-accent/50 bg-accent-dim text-accent"
                    : "border-edge bg-surface-2/60 text-ink-dim hover:border-edge-strong hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What do you need?"
            className="w-full rounded-xl border border-edge bg-surface-2 px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Any details, links or deadlines (optional)"
            rows={4}
            className="os-scroll w-full resize-none rounded-xl border border-edge bg-surface-2 px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={!subject.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
            Send request
          </button>
        </form>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-ink-faint">
          Your recent requests
        </p>
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {requests.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-4">
              <Timer className="mt-0.5 size-4 shrink-0 text-warn" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">{r.subject}</p>
                <p className="mt-1 text-xs text-ink-faint">{relTime(r.at)}</p>
              </div>
              <span className="shrink-0 rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-ink-dim">
                open
              </span>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">
              Nothing yet — your requests will show up here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
