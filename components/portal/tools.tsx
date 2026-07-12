"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  MessageSquare,
  PackageOpen,
  Receipt,
  Rocket,
  Send,
  Timer,
} from "lucide-react";
import { Modal } from "@/components/crm/ui";
import { useCrm } from "@/lib/crm/store";
import {
  fmtDate,
  fmtMoney,
  relTime,
  type Company,
  type Deliverable,
  type Ticket,
} from "@/lib/crm/types";
import {
  deliverablesFor,
  invoicesFor,
  primaryContactFor,
  projectsFor,
  siteHealthFor,
  ticketsFor,
  updatesFor,
} from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";

/** Core portal tool windows. Each renders inside <PortalGate>. */

export function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface-2/60 p-4">
      <p className={`text-xl font-semibold tabular-nums ${accent ? "text-accent" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-dim">{label}</p>
    </div>
  );
}

export function ToolHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-ink-dim">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Website — content, deploys, performance                             */
/* ------------------------------------------------------------------ */

const deployKindLabel = { content: "content", feature: "feature", fix: "fix" };

export function WebsiteTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const site = siteHealthFor(state, company);
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
              · last deploy{" "}
              {site.lastDeployDaysAgo === 0
                ? "today"
                : `${site.lastDeployDaysAgo}d ago`}
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

      <div className="grid grid-cols-3 gap-3">
        <Stat label="uptime · last 90 days" value={site.uptime90d} accent />
        <Stat
          label="visits · last 30 days"
          value={site.visits30d.toLocaleString("en-US")}
        />
        <Stat label="performance score" value={`${site.perf.performance}`} />
      </div>

      {/* Lighthouse-style scores */}
      <div className="rounded-xl border border-edge bg-surface-2/60 p-5">
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Site quality
        </p>
        <div className="mt-4 space-y-3">
          {(
            [
              ["Performance", site.perf.performance],
              ["Accessibility", site.perf.accessibility],
              ["SEO", site.perf.seo],
            ] as const
          ).map(([label, score]) => (
            <div key={label} className="flex items-center gap-3">
              <p className="w-28 shrink-0 text-sm text-ink-dim">{label}</p>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="w-8 shrink-0 text-right font-mono text-sm tabular-nums">
                {score}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pages */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Your pages
        </p>
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {site.pages.map((p) => (
            <div key={p.path} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="truncate font-mono text-xs text-ink-dim">
                  {p.path}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm tabular-nums">
                  {p.views30d.toLocaleString("en-US")}
                </p>
                <p className="text-[11px] text-ink-faint">
                  views · updated {p.updatedDaysAgo}d ago
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deploys */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Recent deploys
        </p>
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {site.deploys.map((dep) => (
            <div key={`${dep.label}-${dep.daysAgo}`} className="flex items-center gap-3.5 p-4">
              <Rocket className="size-4 shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{dep.label}</p>
                <p className="text-xs text-ink-dim">
                  {dep.daysAgo === 0 ? "today" : `${dep.daysAgo} days ago`}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-ink-dim">
                {deployKindLabel[dep.kind]}
              </span>
            </div>
          ))}
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

/* ------------------------------------------------------------------ */
/* Projects — progress, deliverable reviews, updates                   */
/* ------------------------------------------------------------------ */

const deliverableKindLabel: Record<Deliverable["kind"], string> = {
  design: "design",
  staging: "staging link",
  file: "file",
  doc: "document",
};

/** One deliverable awaiting (or holding) the client's verdict. */
function DeliverableReview({ deliverable }: { deliverable: Deliverable }) {
  const { actions } = useCrm();
  const [requesting, setRequesting] = useState(false);
  const [comment, setComment] = useState("");

  const respond = (status: "approved" | "changes_requested") => {
    actions.respondDeliverable(deliverable.id, status, comment);
    playSound(status === "approved" ? "open" : "tap");
    setRequesting(false);
    setComment("");
  };

  const pending = deliverable.status === "in_review";

  return (
    <div
      className={`rounded-xl border p-4 ${
        pending ? "border-accent/40 bg-accent-dim/40" : "border-edge bg-surface-2/60"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <PackageOpen
          className={`size-5 shrink-0 ${pending ? "text-accent" : "text-ink-faint"}`}
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{deliverable.title}</p>
          <p className="text-xs text-ink-dim">
            {deliverableKindLabel[deliverable.kind]} · posted{" "}
            {relTime(deliverable.postedAt)}
          </p>
        </div>
        <a
          href={deliverable.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
        >
          <ExternalLink className="size-3.5" />
          Open
        </a>
      </div>
      {deliverable.note && (
        <p className="mt-2.5 text-base leading-relaxed text-ink-dim">
          {deliverable.note}
        </p>
      )}

      {pending ? (
        requesting ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What should change?"
              rows={2}
              autoFocus
              className="os-scroll w-full resize-none rounded-xl border border-edge bg-surface-2 px-3.5 py-2 text-sm outline-none transition focus:border-accent/50"
            />
            <div className="flex gap-2">
              <button
                onClick={() => respond("changes_requested")}
                disabled={!comment.trim()}
                className="rounded-xl bg-warn px-4 py-2 text-sm font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send request
              </button>
              <button
                onClick={() => setRequesting(false)}
                className="rounded-xl border border-edge px-4 py-2 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => respond("approved")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
            >
              <CheckCircle2 className="size-4" />
              Approve
            </button>
            <button
              onClick={() => setRequesting(true)}
              className="rounded-xl border border-edge px-4 py-2 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
            >
              Request changes
            </button>
          </div>
        )
      ) : (
        <p
          className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium ${
            deliverable.status === "approved" ? "text-accent" : "text-warn"
          }`}
        >
          {deliverable.status === "approved" ? (
            <>
              <CheckCircle2 className="size-3.5" />
              You approved this{" "}
              {deliverable.respondedAt ? relTime(deliverable.respondedAt) : ""}
            </>
          ) : (
            <>
              <MessageSquare className="size-3.5" />
              Changes requested — the team is on it
            </>
          )}
        </p>
      )}
      {deliverable.clientComment && !pending && (
        <p className="mt-1.5 text-xs italic leading-relaxed text-ink-dim">
          “{deliverable.clientComment}”
        </p>
      )}
    </div>
  );
}

export function ProjectsTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const projects = projectsFor(state, company.id);
  const updates = updatesFor(state, company.id);
  const deliverables = deliverablesFor(state, company.id);
  const forReview = deliverables.filter((d) => d.status === "in_review");
  const responded = deliverables.filter((d) => d.status !== "in_review");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <ToolHeader
        title="Your projects"
        subtitle={`Live from ${state.workspace.name}'s production board.`}
      />

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
            <p className="mt-2 text-xs text-ink-dim">
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

      {forReview.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Waiting on your review
          </p>
          <div className="mt-3 space-y-3">
            {forReview.map((d) => (
              <DeliverableReview key={d.id} deliverable={d} />
            ))}
          </div>
        </div>
      )}

      {responded.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
            Reviewed deliverables
          </p>
          <div className="mt-3 space-y-3">
            {responded.slice(0, 4).map((d) => (
              <DeliverableReview key={d.id} deliverable={d} />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Updates from the team
        </p>
        <div className="mt-3 divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
          {updates.slice(0, 6).map((u) => (
            <div key={u.id} className="flex items-start gap-3 p-4">
              <FileText className="mt-0.5 size-4 shrink-0 text-ink-faint" />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{u.summary}</p>
                <p className="mt-1 text-xs text-ink-dim">{relTime(u.at)}</p>
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

/* ------------------------------------------------------------------ */
/* Billing — invoices with a demo pay flow                             */
/* ------------------------------------------------------------------ */

export function BillingTool({ company }: { company: Company }) {
  const { state, actions } = useCrm();
  const invoices = invoicesFor(state, company.id);
  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const dueTotal = invoices
    .filter((i) => i.status === "due")
    .reduce((sum, i) => sum + i.amount, 0);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState<string | null>(null);
  const paying = invoices.find((i) => i.id === payingId) ?? null;

  const confirmPay = () => {
    if (!paying) return;
    actions.payInvoice(paying.id);
    playSound("open");
    setJustPaid(paying.number);
    setPayingId(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <ToolHeader
        title="Invoices & billing"
        subtitle={`Payment history for your work with ${state.workspace.name}.`}
      />

      {justPaid && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-dim p-4">
          <CheckCircle2 className="size-5 shrink-0 text-accent" />
          <p className="text-sm">
            {justPaid} paid — receipt posted to your updates feed. Thank you!
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="open balance" value={fmtMoney(dueTotal)} accent={dueTotal === 0} />
        <Stat label="paid to date" value={fmtMoney(paidTotal)} />
      </div>

      <div className="divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3.5 p-4">
            <Receipt className="size-4 shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{inv.number}</p>
              <p className="truncate text-xs text-ink-dim">{inv.label}</p>
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
                  ? `paid · ${fmtDate(inv.paidAt ?? inv.issuedAt)}`
                  : `due · ${fmtDate(inv.dueAt)}`}
              </p>
            </div>
            {inv.status === "due" && (
              <button
                onClick={() => setPayingId(inv.id)}
                className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-black transition hover:brightness-110"
              >
                Pay
              </button>
            )}
          </div>
        ))}
        {invoices.length === 0 && (
          <p className="p-5 text-sm text-ink-faint">No invoices yet.</p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-dim">
        A question about an invoice?{" "}
        <Link href="/portal/support" className="text-accent hover:underline">
          Send the team a message
        </Link>
        .
      </p>

      <Modal
        open={paying !== null}
        onClose={() => setPayingId(null)}
        title="Pay invoice"
      >
        {paying && (
          <div className="space-y-5">
            <div className="rounded-xl border border-edge bg-surface-2/60 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">{paying.number}</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {fmtMoney(paying.amount)}
                </p>
              </div>
              <p className="mt-1 text-xs text-ink-dim">{paying.label}</p>
            </div>
            <div className="flex items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-4">
              <CreditCard className="size-5 shrink-0 text-ink-dim" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Card on file</p>
                <p className="font-mono text-xs text-ink-dim">
                  •••• •••• •••• 4242
                </p>
              </div>
              <span className="rounded-full border border-edge px-2.5 py-1 text-[11px] text-ink-dim">
                demo
              </span>
            </div>
            <button
              onClick={confirmPay}
              className="w-full rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
            >
              Pay {fmtMoney(paying.amount)}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-ink-faint">
              Demo payment — no card is charged. Stripe handles this for real
              once payments connect.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Support — tickets with threads                                      */
/* ------------------------------------------------------------------ */

const REQUEST_TOPICS = [
  "Website change",
  "New work",
  "Billing question",
  "Something else",
];

const ticketStatusStyle: Record<
  Ticket["status"],
  { label: string; cls: string }
> = {
  open: { label: "open", cls: "text-warn" },
  in_progress: { label: "in progress", cls: "text-accent" },
  resolved: { label: "resolved", cls: "text-ink-faint" },
};

function TicketThread({
  ticket,
  authorName,
}: {
  ticket: Ticket;
  authorName: string;
}) {
  const { actions } = useCrm();
  const [reply, setReply] = useState("");

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    actions.replyTicket(ticket.id, "client", authorName, reply);
    playSound("tap");
    setReply("");
  };

  return (
    <div className="space-y-3 border-t border-edge bg-surface/40 p-4">
      {ticket.messages.map((m) => (
        <div
          key={m.id}
          className={`max-w-[85%] rounded-xl border p-3 ${
            m.from === "client"
              ? "ml-auto border-accent/30 bg-accent-dim"
              : "border-edge bg-surface-2/60"
          }`}
        >
          <p className="text-sm leading-relaxed">{m.text}</p>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            {m.author} · {relTime(m.at)}
          </p>
        </div>
      ))}
      {ticket.status !== "resolved" && (
        <form onSubmit={send} className="flex gap-2 pt-1">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to the team…"
            className="min-w-0 flex-1 rounded-xl border border-edge bg-surface-2 px-3.5 py-2 text-sm outline-none transition focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={!reply.trim()}
            aria-label="Send reply"
            className="rounded-xl bg-accent px-3.5 py-2 text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export function SupportTool({ company }: { company: Company }) {
  const { state, actions } = useCrm();
  const contact = primaryContactFor(state, company.id);
  const authorName = contact?.name ?? company.name;
  const tickets = ticketsFor(state, company.id);

  const [topic, setTopic] = useState(REQUEST_TOPICS[0]);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const line = subject.trim();
    if (!line) return;
    // The round trip: the request becomes a ticket in the agency's Support
    // queue; replies and status changes land back here.
    const ticket = actions.createTicket({
      companyId: company.id,
      contactId: contact?.id ?? null,
      author: authorName,
      topic,
      subject: line,
      details,
    });
    playSound("open");
    setSubject("");
    setDetails("");
    setSent(true);
    setOpenId(ticket.id);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <ToolHeader
        title="Support"
        subtitle={`Requests go straight into ${state.workspace.name}'s queue — replies within one business day.`}
      />

      {sent ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-accent/30 bg-accent-dim p-8 text-center">
          <CheckCircle2 className="size-8 text-accent" strokeWidth={1.5} />
          <div>
            <p className="text-[15px] font-medium">Request received</p>
            <p className="mt-1 text-sm text-ink-dim">
              It&apos;s in the team&apos;s queue — track it below, replies land
              in the thread.
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
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Your requests
        </p>
        <div className="mt-3 space-y-3">
          {tickets.map((t) => {
            const style = ticketStatusStyle[t.status];
            const open = openId === t.id;
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-xl border border-edge bg-surface-2/60"
              >
                <button
                  onClick={() => setOpenId(open ? null : t.id)}
                  className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-3/60"
                >
                  {t.status === "resolved" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                  ) : (
                    <Timer className="mt-0.5 size-4 shrink-0 text-warn" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{t.subject}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-ink-dim">
                      <MessageSquare className="size-3" />
                      {t.messages.length}{" "}
                      {t.messages.length === 1 ? "message" : "messages"} ·
                      updated {relTime(t.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium ${style.cls}`}
                  >
                    {style.label}
                  </span>
                </button>
                {open && <TicketThread ticket={t} authorName={authorName} />}
              </div>
            );
          })}
          {tickets.length === 0 && (
            <p className="rounded-xl border border-edge bg-surface-2/60 p-5 text-sm text-ink-faint">
              Nothing yet — your requests will show up here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
