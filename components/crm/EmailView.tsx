"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  BellRing,
  FilePen,
  Inbox,
  LifeBuoy,
  Mail,
  MailPlus,
  Megaphone,
  PackageOpen,
  Receipt,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { createClient } from "@/lib/supabase/client";
import { fmtTime, initials, relTime, type EmailThread } from "@/lib/crm/types";
import {
  Card,
  EmptyState,
  Field,
  GhostButton,
  Modal,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

/**
 * Mail. The Inbox tab is real two-way email: outbound goes through the
 * outbox pipeline (send_thread_email -> Resend, with proper threading
 * headers), inbound arrives via Resend inbound routing -> receive-email edge
 * function -> ingest_inbound_email, threaded onto contacts and leads.
 * The Automated tab covers the transactional events the database sends
 * by itself, with the live delivery log.
 */

/* ------------------------------------------------------------------ */
/* Inbox                                                               */
/* ------------------------------------------------------------------ */

/** Who the conversation is with, for list rows and the thread header. */
function useCounterpart() {
  const { state } = useCrm();
  const { contactById } = useCrmLookups();
  return useCallback(
    (thread: EmailThread): { name: string; email: string } => {
      const contact = thread.contactId
        ? contactById.get(thread.contactId)
        : undefined;
      if (contact) return { name: contact.name, email: contact.email };
      const lead = thread.leadId
        ? state.leads.find((l) => l.id === thread.leadId)
        : undefined;
      if (lead) return { name: lead.name || lead.email, email: lead.email };
      const inbound = [...thread.messages].reverse().find((m) => m.direction === "in");
      if (inbound) {
        return { name: inbound.fromName || inbound.fromEmail, email: inbound.fromEmail };
      }
      const out = thread.messages.find((m) => m.direction === "out");
      const email = out?.toEmails[0] ?? "";
      return { name: email || "Unknown", email };
    },
    [state.leads, contactById],
  );
}

/** Where a reply on this thread goes. */
function replyRecipients(thread: EmailThread, fallback: string): string[] {
  const inbound = [...thread.messages].reverse().find((m) => m.direction === "in");
  if (inbound) return [inbound.fromEmail];
  if (fallback) return [fallback];
  const out = [...thread.messages].reverse().find((m) => m.direction === "out");
  return out?.toEmails ?? [];
}

function ThreadListItem({
  thread,
  selected,
  onSelect,
}: {
  thread: EmailThread;
  selected: boolean;
  onSelect: () => void;
}) {
  const counterpartOf = useCounterpart();
  const who = counterpartOf(thread);
  return (
    <button
      onClick={onSelect}
      className={`block w-full border-b border-edge p-3.5 text-left transition last:border-b-0 ${
        selected ? "bg-accent-dim" : "hover:bg-surface-2"
      }`}
    >
      <div className="flex items-center gap-2">
        {thread.unread && (
          <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
        )}
        <p
          className={`min-w-0 flex-1 truncate text-sm ${
            thread.unread ? "font-semibold" : "font-medium"
          }`}
        >
          {who.name}
        </p>
        <span className="shrink-0 text-[11px] text-ink-faint">
          {relTime(thread.lastMessageAt)}
        </span>
      </div>
      <p className={`mt-0.5 truncate text-xs ${thread.unread ? "text-ink" : "text-ink-dim"}`}>
        {thread.subject}
      </p>
      <p className="mt-0.5 truncate text-xs text-ink-faint">
        {thread.lastDirection === "out" ? "You: " : ""}
        {thread.snippet}
      </p>
    </button>
  );
}

function Conversation({
  thread,
  onBack,
}: {
  thread: EmailThread;
  onBack: () => void;
}) {
  const { actions } = useCrm();
  const { companyById } = useCrmLookups();
  const counterpartOf = useCounterpart();
  const who = counterpartOf(thread);
  const company = thread.companyId ? companyById.get(thread.companyId) : undefined;
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.id, thread.messages.length]);

  const send = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await actions.sendEmail({
        threadId: thread.id,
        to: replyRecipients(thread, who.email),
        subject: thread.subject,
        body,
      });
      setReply("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex min-h-105 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-edge p-4">
        <button
          onClick={onBack}
          aria-label="Back to inbox"
          className="rounded-lg p-1 text-ink-faint transition hover:bg-surface-2 hover:text-ink md:hidden"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{thread.subject}</p>
          <p className="truncate text-xs text-ink-faint">
            {who.name}
            {who.email ? ` · ${who.email}` : ""}
            {company ? ` · ${company.name}` : ""}
          </p>
        </div>
        <GhostButton
          onClick={() => {
            onBack();
            actions.deleteEmailThread(thread.id);
          }}
          title="Delete conversation"
        >
          <Trash2 className="size-3.5" />
        </GhostButton>
      </div>

      <div className="max-h-130 flex-1 space-y-4 overflow-y-auto p-4">
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.direction === "out" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                m.direction === "out"
                  ? "bg-accent-dim text-accent"
                  : "bg-surface-3 text-ink-dim"
              }`}
            >
              {initials(m.fromName || m.fromEmail || "?")}
            </div>
            <div
              className={`max-w-[85%] rounded-xl border px-3.5 py-2.5 ${
                m.direction === "out"
                  ? "border-accent/20 bg-accent-dim/60"
                  : "border-edge bg-surface-2"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.bodyText}</p>
              <p className="mt-1.5 text-[11px] text-ink-faint">
                {m.fromName || m.fromEmail} · {relTime(m.at)} · {fmtTime(m.at)}
              </p>
            </div>
          </div>
        ))}
        {thread.messages.length === 0 && (
          <p className="p-2 text-sm text-ink-faint">Sending…</p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-edge p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
            }}
            rows={2}
            placeholder={`Reply to ${who.name}… (⌘↵ to send)`}
            className={`${inputCls} resize-none`}
          />
          <PrimaryButton
            onClick={() => void send()}
            disabled={sending || !reply.trim()}
            className="shrink-0"
          >
            <Send className="size-4" />
            {sending ? "Sending…" : "Send"}
          </PrimaryButton>
        </div>
      </div>
    </Card>
  );
}

/** Mounted fresh on every open — render it conditionally. */
function ComposeModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (threadId: string | null) => void;
}) {
  const { state, actions } = useCrm();
  const [recipientKey, setRecipientKey] = useState("manual");
  const [manualTo, setManualTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const contactOptions = state.contacts.filter((c) => c.email);
  const leadOptions = state.leads.filter(
    (l) => l.email && l.status !== "converted",
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const [kind, id] = recipientKey.split(":");
    const contact =
      kind === "contact" ? contactOptions.find((c) => c.id === id) : undefined;
    const lead = kind === "lead" ? leadOptions.find((l) => l.id === id) : undefined;
    const to = contact?.email ?? lead?.email ?? manualTo.trim();
    if (!to || !body.trim()) return;
    setSending(true);
    try {
      const threadId = await actions.sendEmail({
        contactId: contact?.id ?? null,
        leadId: lead?.id ?? null,
        to: [to],
        subject: subject.trim() || "(no subject)",
        body,
      });
      onSent(threadId);
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="New email">
      <form onSubmit={submit} className="space-y-4">
        <Field label="To">
          <select
            value={recipientKey}
            onChange={(e) => setRecipientKey(e.target.value)}
            className={inputCls}
          >
            <option value="manual">Type an address…</option>
            {contactOptions.length > 0 && (
              <optgroup label="Contacts">
                {contactOptions.map((c) => (
                  <option key={c.id} value={`contact:${c.id}`}>
                    {c.name} — {c.email}
                  </option>
                ))}
              </optgroup>
            )}
            {leadOptions.length > 0 && (
              <optgroup label="Leads">
                {leadOptions.map((l) => (
                  <option key={l.id} value={`lead:${l.id}`}>
                    {l.name || l.email} — {l.email}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </Field>
        {recipientKey === "manual" && (
          <Field label="Address">
            <input
              value={manualTo}
              onChange={(e) => setManualTo(e.target.value)}
              placeholder="name@company.com"
              type="email"
              className={inputCls}
            />
          </Field>
        )}
        <Field label="Subject">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Quick question about…"
            className={inputCls}
          />
        </Field>
        <Field label="Message">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className={`${inputCls} resize-none`}
          />
        </Field>
        <PrimaryButton
          type="submit"
          disabled={sending}
          className="w-full justify-center"
        >
          <Send className="size-4" />
          {sending ? "Sending…" : "Send email"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function InboxTab({ onCompose }: { onCompose: () => void }) {
  const { state, actions, mode } = useCrm();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const threads = state.emailThreads;
  const selected = threads.find((t) => t.id === selectedId) ?? null;

  const select = (thread: EmailThread) => {
    setSelectedId(thread.id);
    if (thread.unread) actions.markThreadRead(thread.id);
  };

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={<Mail className="size-6" strokeWidth={1.5} />}
        title="No conversations yet"
        hint={
          mode === "db"
            ? state.workspace.inboundAddress
              ? `Replies to ${state.workspace.inboundAddress} land here automatically. Start by writing to a contact or lead.`
              : "Write to any contact or lead from here. To receive replies in this inbox, set your inbound address in Settings → Workspace and wire it up in Resend."
            : "This demo inbox fills up when you email a contact or lead."
        }
      >
        <PrimaryButton onClick={onCompose}>
          <MailPlus className="size-4" />
          New email
        </PrimaryButton>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <Card className={`self-start overflow-hidden ${selected ? "hidden md:block" : ""}`}>
        {threads.map((t) => (
          <ThreadListItem
            key={t.id}
            thread={t}
            selected={t.id === selectedId}
            onSelect={() => select(t)}
          />
        ))}
      </Card>
      {selected ? (
        <Conversation thread={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <Card className="hidden min-h-105 items-center justify-center md:flex">
          <p className="text-sm text-ink-faint">Pick a conversation.</p>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Automated (transactional pipeline)                                  */
/* ------------------------------------------------------------------ */

/** The transactional events the database actually enqueues. */
const LIVE_EVENTS: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: Receipt, label: "Invoice issued", detail: "client gets the invoice with amount and due date — retainers fire this on their billing day" },
  { icon: BellRing, label: "Payment reminder", detail: "sent from Billing on any due invoice" },
  { icon: Receipt, label: "Invoice paid", detail: "receipt to the client, heads-up to you" },
  { icon: FilePen, label: "Contract sent / signed", detail: "client gets the signing link; you get the signature" },
  { icon: LifeBuoy, label: "Ticket opened / replied", detail: "each side is emailed when the other writes" },
  { icon: PackageOpen, label: "Deliverable posted / responded", detail: "review requests and approvals, both directions" },
  { icon: Sparkles, label: "Website lead intake", detail: "you get the inquiry; the lead gets a confirmation" },
];

type OutboxRow = {
  id: string;
  event: string;
  recipients: string[];
  status: string;
  attempts: number;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

const statusCls: Record<string, string> = {
  sent: "border-accent/40 text-accent",
  pending: "border-warn/40 text-warn",
  error: "border-danger/40 text-danger",
  skipped: "border-edge text-ink-faint",
};

function DeliveryLog() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<OutboxRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRows = useCallback(
    () =>
      supabase
        .from("email_outbox")
        .select("id, event, recipients, status, attempts, error, created_at, sent_at")
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data }) => setRows(data ?? [])),
    [supabase],
  );

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const load = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionLabel>Delivery log</SectionLabel>
        <GhostButton onClick={() => void load()} disabled={refreshing}>
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </GhostButton>
      </div>
      <Card className="mt-3 divide-y divide-edge">
        {(rows ?? []).map((r) => (
          <div key={r.id} className="flex items-center gap-3.5 p-4">
            <MailPlus className="size-4 shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.event}</p>
              <p className="truncate text-xs text-ink-faint">
                to {r.recipients.join(", ")} · {relTime(Date.parse(r.created_at))}
                {r.error ? ` · ${r.error}` : ""}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${statusCls[r.status] ?? "border-edge text-ink-faint"}`}
            >
              {r.status}
              {r.status === "pending" && r.attempts > 0 ? ` · try ${r.attempts}` : ""}
            </span>
          </div>
        ))}
        {rows !== null && rows.length === 0 && (
          <div className="flex items-center gap-3 p-5 text-sm text-ink-faint">
            <Inbox className="size-4" />
            Nothing sent yet — issue an invoice, send a contract or reply to a
            ticket and it lands here.
          </div>
        )}
        {rows === null && (
          <p className="p-5 text-sm text-ink-faint">Loading…</p>
        )}
      </Card>
    </div>
  );
}

type Sequence = {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
};

const SEQUENCES: Sequence[] = [
  {
    id: "seq-welcome",
    name: "New client welcome",
    trigger: "Fires when a deal is won",
    steps: [
      "Day 0 — Welcome + portal invite",
      "Day 2 — Meet your team & what happens next",
      "Day 7 — How to request changes (guide link)",
    ],
  },
  {
    id: "seq-proposal",
    name: "Proposal follow-up",
    trigger: "Fires 3 days after a proposal goes quiet",
    steps: [
      "Day 3 — Any questions on the proposal?",
      "Day 7 — Case study relevant to their industry",
      "Day 14 — Last check-in, then close the loop",
    ],
  },
  {
    id: "seq-winback",
    name: "Cold lead win-back",
    trigger: "Fires when a deal sits untouched for 30 days",
    steps: [
      "Day 0 — 'Still on your radar?' one-liner",
      "Day 10 — What's new since we last talked",
    ],
  },
];

function AutomatedTab() {
  const { state, mode } = useCrm();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "seq-welcome": true,
    "seq-proposal": true,
    "seq-winback": false,
  });
  const activeRules = state.rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Sends automatically</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {LIVE_EVENTS.map((e) => (
            <div key={e.label} className="flex items-center gap-3.5 p-4">
              <e.icon className="size-4 shrink-0 text-accent" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{e.label}</p>
                <p className="truncate text-xs text-ink-faint">{e.detail}</p>
              </div>
              <Zap className="size-3.5 shrink-0 text-ink-faint" />
            </div>
          ))}
        </Card>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          Fired by the database itself, so they send no matter where the change
          comes from — this CRM, the client portal or an automation.{" "}
          {activeRules} CRM automation{activeRules === 1 ? "" : "s"} (Settings →
          Automations) run on the same triggers.
        </p>
      </div>

      {mode === "db" && <DeliveryLog />}

      <div>
        <div className="flex items-center gap-2">
          <SectionLabel>Sequences</SectionLabel>
          <span className="rounded-full border border-edge px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-faint">
            Preview
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {SEQUENCES.map((seq) => {
            const on = enabled[seq.id];
            return (
              <Card key={seq.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Workflow
                      className={`size-5 shrink-0 ${on ? "text-accent" : "text-ink-faint"}`}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{seq.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-dim">
                        <Zap className="size-3" />
                        {seq.trigger}
                      </p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    onClick={() =>
                      setEnabled((e) => ({ ...e, [seq.id]: !e[seq.id] }))
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      on ? "bg-accent" : "bg-surface-3"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                        on ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {seq.steps.map((s) => (
                    <li key={s} className="flex items-center gap-2.5 text-sm text-ink-dim">
                      <span className="size-1.5 shrink-0 rounded-full bg-ink-faint" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
        <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
          <Megaphone className="mt-0.5 size-3.5 shrink-0" />
          Multi-step sequences and broadcasts ride the same outbox pipeline
          when they ship — the plumbing above is already live.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export default function EmailView() {
  const { state, mode } = useCrm();
  const [tab, setTab] = useState<"inbox" | "automated">("inbox");
  const [composing, setComposing] = useState(false);
  const unread = state.emailThreads.filter((t) => t.unread).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-16 md:p-8">
      <PageHeader
        title="Mail"
        subtitle={
          mode === "db"
            ? "Real correspondence, threaded onto your contacts and leads — replies land back in this inbox."
            : "Two-way email goes live in a signed-in workspace; this demo shows the inbox with sample conversations."
        }
      >
        <PrimaryButton onClick={() => setComposing(true)}>
          <MailPlus className="size-4" />
          New email
        </PrimaryButton>
      </PageHeader>

      <div className="flex items-center gap-1 border-b border-edge">
        {(
          [
            { id: "inbox", label: "Inbox" },
            { id: "automated", label: "Automated" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative -mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition ${
              tab === t.id
                ? "border-accent font-medium text-ink"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            {t.label}
            {t.id === "inbox" && unread > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-black">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "inbox" ? <InboxTab onCompose={() => setComposing(true)} /> : <AutomatedTab />}

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSent={() => setTab("inbox")}
        />
      )}
    </div>
  );
}
