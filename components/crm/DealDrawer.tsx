"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Kanban,
  MessageSquare,
  PackageOpen,
  Plus,
  Send,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { computeDealHealth, healthStyle } from "@/lib/crm/pulse";
import { uploadWorkspaceFile, useWorkspaceFiles } from "@/lib/crm/files";
import {
  DAY,
  fmtMoney,
  fmtTime,
  relTime,
  type Deal,
  type DeliverableKind,
} from "@/lib/crm/types";
import { Drawer, Field, SectionLabel, inputCls } from "./ui";
import FileLink from "./FileLink";

const DELIVERABLE_KINDS: { id: DeliverableKind; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "staging", label: "Staging link" },
  { id: "file", label: "File" },
  { id: "doc", label: "Document" },
];

/** Post work for client review and track their verdicts, per deal. */
function DeliverablesSection({ deal }: { deal: Deal }) {
  const { state, actions, mode } = useCrm();
  const { supabase, workspaceId } = useWorkspaceFiles();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DeliverableKind>("design");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const deliverables = state.deliverables
    .filter((d) => d.dealId === deal.id)
    .sort((a, b) => b.postedAt - a.postedAt);

  if (!deal.companyId) return null;

  // Real uploads exist only against the database; the demo keeps link-paste.
  const canUpload =
    mode === "db" && workspaceId !== null && (kind === "file" || kind === "doc");
  const ready = title.trim() !== "" && (canUpload ? file !== null : url.trim() !== "");

  const post = async () => {
    if (!ready || uploading || !deal.companyId) return;
    let filePath = "";
    if (canUpload && file && workspaceId) {
      setUploading(true);
      setUploadError("");
      try {
        const att = await uploadWorkspaceFile(supabase, {
          workspaceId,
          companyId: deal.companyId,
          scope: "deliverables",
          recordId: crypto.randomUUID(),
          file,
        });
        filePath = att.path;
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    actions.addDeliverable({
      companyId: deal.companyId,
      dealId: deal.id,
      title: title.trim(),
      kind,
      url: filePath ? "" : url.trim(),
      filePath,
    });
    setTitle("");
    setUrl("");
    setFile(null);
  };

  return (
    <div className="mt-6">
      <SectionLabel>Deliverables — client reviews these in their portal</SectionLabel>
      <div className="mt-2 space-y-1.5">
        {deliverables.map((d) => (
          <div
            key={d.id}
            className="rounded-lg border border-edge bg-surface-2/65 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5 text-sm">
              {d.status === "approved" ? (
                <CheckCircle2 className="size-4 shrink-0 text-accent" />
              ) : d.status === "changes_requested" ? (
                <MessageSquare className="size-4 shrink-0 text-warn" />
              ) : (
                <Timer className="size-4 shrink-0 text-ink-faint" />
              )}
              {d.filePath ? (
                <FileLink
                  path={d.filePath}
                  name={d.title}
                  className="min-w-0 flex-1 truncate text-left hover:text-accent"
                />
              ) : (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate hover:text-accent"
                >
                  {d.title}
                </a>
              )}
              <span
                className={`shrink-0 text-[11px] font-medium ${
                  d.status === "approved"
                    ? "text-accent"
                    : d.status === "changes_requested"
                      ? "text-warn"
                      : "text-ink-faint"
                }`}
              >
                {d.status === "approved"
                  ? "approved"
                  : d.status === "changes_requested"
                    ? "changes requested"
                    : "in review"}
              </span>
            </div>
            {d.clientComment && (
              <p className="mt-1.5 pl-6.5 text-xs italic leading-relaxed text-ink-dim">
                “{d.clientComment}”
              </p>
            )}
          </div>
        ))}
        <div className="space-y-2 rounded-lg border border-dashed border-edge p-3">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's ready for review?"
              className={inputCls}
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DeliverableKind)}
              className={`${inputCls} w-32 shrink-0`}
            >
              {DELIVERABLE_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {canUpload ? (
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={`${inputCls} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent-dim file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-accent`}
              />
            ) : (
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && post()}
                placeholder="Link (Figma, staging, file…)"
                className={inputCls}
              />
            )}
            <button
              onClick={post}
              disabled={!ready || uploading}
              aria-label="Post deliverable"
              className="shrink-0 rounded-xl bg-accent px-3.5 text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PackageOpen className={`size-4 ${uploading ? "animate-pulse" : ""}`} />
            </button>
          </div>
          {uploadError && (
            <p className="text-xs text-warn">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DealDrawer({
  dealId,
  onClose,
}: {
  dealId: string;
  onClose: () => void;
}) {
  const { state, actions } = useCrm();
  const { contactById, stageById } = useCrmLookups();
  const deal = state.deals.find((d) => d.id === dealId);
  const [note, setNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [now] = useState(() => Date.now());

  if (!deal) return null;

  const stage = stageById.get(deal.stageId);
  const isOpen = stage?.kind === "open";
  const health = isOpen ? computeDealHealth(state, deal, now) : null;
  const tasks = state.tasks.filter((t) => t.dealId === deal.id && !t.done);
  const events = state.events
    .filter((e) => e.dealId === deal.id && !e.done)
    .sort((a, b) => a.startAt - b.startAt)
    .slice(0, 3);
  const timeline = state.activities
    .filter((a) => a.dealId === deal.id)
    .sort((a, b) => b.at - a.at)
    .slice(0, 12);
  const wonStage = state.stages.find((s) => s.kind === "won");
  const lostStage = state.stages.find((s) => s.kind === "lost");

  const patch = (p: Partial<Deal>) => actions.updateDeal(deal.id, p);

  const logNote = () => {
    if (!note.trim()) return;
    actions.logActivity({
      type: "note",
      summary: note.trim(),
      dealId: deal.id,
      contactId: deal.contactId,
      companyId: deal.companyId,
    });
    setNote("");
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    actions.addTask(newTask.trim(), now + DAY, {
      dealId: deal.id,
      contactId: deal.contactId,
    });
    setNewTask("");
  };

  return (
    <Drawer open onClose={onClose} title={`${fmtMoney(deal.value)} — ${stage?.name ?? ""}`}>
      {/* Editable core fields */}
      <div className="space-y-4">
        <Field label="Deal name">
          <input
            value={deal.name}
            onChange={(e) => patch({ name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Value (USD)">
            <input
              value={String(deal.value)}
              onChange={(e) =>
                patch({ value: Math.max(0, Number(e.target.value) || 0) })
              }
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Stage">
            <select
              value={deal.stageId}
              onChange={(e) => actions.moveDeal(deal.id, e.target.value)}
              className={inputCls}
            >
              {state.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact">
            <select
              value={deal.contactId ?? ""}
              onChange={(e) => {
                const contact = state.contacts.find(
                  (c) => c.id === e.target.value,
                );
                patch({
                  contactId: e.target.value || null,
                  companyId: contact?.companyId ?? deal.companyId,
                });
              }}
              className={inputCls}
            >
              <option value="">None</option>
              {state.contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source">
            <select
              value={deal.source}
              onChange={(e) => patch({ source: e.target.value })}
              className={inputCls}
            >
              {[deal.source, "Referral", "Website", "Google search", "Instagram", "Cold outreach", "Waitlist", "Website audit", "Contact form", "Existing client"]
                .filter((s, i, arr) => arr.indexOf(s) === i)
                .map((s) => (
                  <option key={s}>{s}</option>
                ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Health */}
      {health && (
        <div className="mt-5 rounded-xl border border-edge bg-surface-2/50 p-4">
          <div className="flex items-baseline justify-between">
            <SectionLabel>Pulse health</SectionLabel>
            <span
              className={`font-mono text-lg font-semibold tabular-nums ${healthStyle[health.status].text}`}
            >
              {health.score}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className={`h-full rounded-full ${healthStyle[health.status].bar}`}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-ink-faint">
            last touch {health.daysSinceTouch}d (cadence {health.cadence}d) ·{" "}
            {health.daysInStage}d in stage
            {health.overdueTasks > 0 && (
              <span className="text-danger"> · {health.overdueTasks} overdue</span>
            )}
          </p>
        </div>
      )}

      {/* Win / lose / delete */}
      <div className="mt-4 flex flex-wrap gap-2">
        {isOpen && wonStage && (
          <button
            onClick={() => actions.moveDeal(deal.id, wonStage.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-black transition hover:brightness-110"
          >
            <Trophy className="size-4" />
            Mark won
          </button>
        )}
        {isOpen && lostStage && (
          <button
            onClick={() => actions.moveDeal(deal.id, lostStage.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge px-3.5 py-2 text-sm font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            <X className="size-4" />
            Mark lost
          </button>
        )}
        <button
          onClick={() => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            actions.deleteDeal(deal.id);
            onClose();
          }}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
            confirmDelete
              ? "border-danger/50 bg-danger/10 text-danger"
              : "border-edge text-ink-dim hover:text-danger"
          }`}
        >
          <Trash2 className="size-4" />
          {confirmDelete ? "Confirm delete" : "Delete"}
        </button>
      </div>

      {/* Upcoming events */}
      {events.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Scheduled</SectionLabel>
          <div className="mt-2 space-y-1.5">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2.5 rounded-lg border border-edge bg-surface-2/65 px-3 py-2.5 text-sm"
              >
                <CalendarDays className="size-4 shrink-0 text-ink-faint" />
                <span className="min-w-0 flex-1 truncate">{e.title}</span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {new Date(e.startAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  {fmtTime(e.startAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="mt-6">
        <SectionLabel>Tasks</SectionLabel>
        <div className="mt-2 space-y-1.5">
          {tasks.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-edge bg-surface-2/65 px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => actions.toggleTask(t.id)}
                className="size-4 accent-[#34d399]"
              />
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="shrink-0 text-xs text-ink-faint">
                {relTime(t.dueAt)}
              </span>
            </label>
          ))}
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task (due tomorrow)…"
              className={inputCls}
            />
            <button
              onClick={addTask}
              aria-label="Add task"
              className="shrink-0 rounded-xl border border-edge px-3.5 text-ink-dim transition hover:border-edge-strong hover:text-ink"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <DeliverablesSection deal={deal} />

      {/* Quick note */}
      <div className="mt-6">
        <SectionLabel>Log a note</SectionLabel>
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && logNote()}
            placeholder="Client asked for revised timeline…"
            className={inputCls}
          />
          <button
            onClick={logNote}
            aria-label="Save note"
            className="shrink-0 rounded-xl bg-accent px-3.5 text-black transition hover:brightness-110"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <SectionLabel>Timeline</SectionLabel>
        <div className="mt-2 divide-y divide-edge">
          {timeline.map((a) => {
            const contact = a.contactId ? contactById.get(a.contactId) : null;
            return (
              <div key={a.id} className="flex items-start gap-3 py-3">
                {a.type === "stage" ? (
                  <Kanban className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                ) : (
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                )}
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed">{a.summary}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {a.type} · {relTime(a.at)}
                    {contact ? ` · ${contact.name}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
          {timeline.length === 0 && (
            <p className="py-4 text-sm text-ink-faint">No activity yet.</p>
          )}
        </div>
      </div>
    </Drawer>
  );
}
