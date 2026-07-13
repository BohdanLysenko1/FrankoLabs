"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, LifeBuoy, MessageSquare, Paperclip, Send, Timer, X } from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { uploadWorkspaceFile, useWorkspaceFiles } from "@/lib/crm/files";
import { relTime, type Ticket, type TicketStatus } from "@/lib/crm/types";
import { Card, Drawer, EmptyState, PageHeader } from "./ui";
import FileLink from "./FileLink";

const FILTERS: { id: TicketStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
];

const statusStyle: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "open", cls: "border-warn/40 text-warn" },
  in_progress: { label: "in progress", cls: "border-accent/40 text-accent" },
  resolved: { label: "resolved", cls: "border-edge text-ink-faint" },
};

function TicketDetail({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const { state, actions, mode } = useCrm();
  const { supabase, workspaceId } = useWorkspaceFiles();
  const { companyById } = useCrmLookups();
  const company = companyById.get(ticket.companyId);
  const agent = state.team[0];
  const [reply, setReply] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const canAttach = mode === "db" && workspaceId !== null;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if ((!reply.trim() && !file) || sending) return;
    let attachments;
    if (file && canAttach && workspaceId) {
      setSending(true);
      try {
        attachments = [
          await uploadWorkspaceFile(supabase, {
            workspaceId,
            companyId: ticket.companyId,
            scope: "tickets",
            recordId: ticket.id,
            file,
          }),
        ];
      } catch {
        setSending(false);
        return;
      }
      setSending(false);
    }
    actions.replyTicket(ticket.id, "agency", agent?.name ?? "Team", reply, attachments);
    setReply("");
    setFile(null);
  };

  return (
    <Drawer open onClose={onClose} title={ticket.subject}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-dim">
          <span className="rounded-full border border-edge px-2.5 py-1">
            {company?.name ?? "Unknown"}
          </span>
          <span className="rounded-full border border-edge px-2.5 py-1">
            {ticket.topic}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 font-medium ${statusStyle[ticket.status].cls}`}
          >
            {statusStyle[ticket.status].label}
          </span>
        </div>

        <div className="space-y-3">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-xl border p-3.5 ${
                m.from === "agency"
                  ? "ml-auto border-accent/30 bg-accent-dim"
                  : "border-edge bg-surface-2/60"
              }`}
            >
              {m.text && <p className="text-sm leading-relaxed">{m.text}</p>}
              {m.attachments.map((a) => (
                <FileLink key={a.path} path={a.path} name={a.name} size={a.size} />
              ))}
              <p className="mt-1.5 text-[11px] text-ink-faint">
                {m.author} · {relTime(m.at)}
              </p>
            </div>
          ))}
        </div>

        {ticket.status !== "resolved" ? (
          <>
            <form onSubmit={send} className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply to the client…"
                  className="min-w-0 flex-1 rounded-xl border border-edge bg-surface-2 px-3.5 py-2.5 text-sm outline-none transition focus:border-accent/50"
                />
                {canAttach && (
                  <label
                    aria-label="Attach a file"
                    className="flex cursor-pointer items-center rounded-xl border border-edge bg-surface-2/60 px-3 text-ink-dim transition hover:border-edge-strong hover:text-ink"
                  >
                    <Paperclip className="size-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                <button
                  type="submit"
                  disabled={(!reply.trim() && !file) || sending}
                  aria-label="Send reply"
                  className="rounded-xl bg-accent px-4 py-2.5 text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className={`size-4 ${sending ? "animate-pulse" : ""}`} />
                </button>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink"
                >
                  <Paperclip className="size-3" />
                  {file.name}
                  <X className="size-3" />
                </button>
              )}
            </form>
            <button
              onClick={() => {
                actions.setTicketStatus(ticket.id, "resolved");
                actions.logActivity({
                  type: "system",
                  summary: `Support request resolved: ${ticket.subject}`,
                  companyId: ticket.companyId,
                  contactId: ticket.contactId,
                  clientVisible: true,
                });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-edge bg-surface-2/60 px-4 py-2.5 text-sm font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink"
            >
              <CheckCircle2 className="size-4" />
              Mark resolved — the client sees it instantly
            </button>
          </>
        ) : (
          <button
            onClick={() => actions.setTicketStatus(ticket.id, "open")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-edge bg-surface-2/60 px-4 py-2.5 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            <Timer className="size-4" />
            Reopen ticket
          </button>
        )}
      </div>
    </Drawer>
  );
}

export default function SupportView() {
  const { state } = useCrm();
  const { companyById } = useCrmLookups();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const tickets = state.tickets
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const open = state.tickets.find((t) => t.id === openId) ?? null;
  const activeCount = state.tickets.filter((t) => t.status !== "resolved").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-16 md:p-8">
      <PageHeader
        title="Support"
        subtitle={`Every client request in one queue — ${activeCount} active. Replies and status changes land in the client's portal thread.`}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              filter === f.id
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-edge bg-surface-2/60 text-ink-dim hover:border-edge-strong hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="size-6" strokeWidth={1.5} />}
          title="Queue is clear"
          hint="Client requests from the portal land here with full context."
        />
      ) : (
        <Card className="divide-y divide-edge">
          {tickets.map((t) => {
            const company = companyById.get(t.companyId);
            const last = t.messages[t.messages.length - 1];
            return (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className="flex w-full items-start gap-3.5 p-4 text-left transition hover:bg-surface-2/60"
              >
                <LifeBuoy
                  className={`mt-0.5 size-4 shrink-0 ${
                    t.status === "resolved" ? "text-ink-faint" : "text-accent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.subject}</p>
                  <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-ink-faint">
                    {company?.name ?? "Unknown"} · {t.topic}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {t.messages.length}
                    </span>
                    · {last ? `${last.from === "client" ? "client" : "team"} replied ${relTime(last.at)}` : relTime(t.updatedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyle[t.status].cls}`}
                >
                  {statusStyle[t.status].label}
                </span>
              </button>
            );
          })}
        </Card>
      )}

      {open && <TicketDetail ticket={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
