"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  Check,
  ClipboardPaste,
  Download,
  Globe,
  ListPlus,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Target,
  Trash2,
  Upload,
  UserRoundCheck,
} from "lucide-react";
import { useCrm, type NewLeadInput } from "@/lib/crm/store";
import {
  DAY,
  LEAD_STATUSES,
  relTime,
  type Lead,
  type LeadStatus,
} from "@/lib/crm/types";
import {
  Card,
  Drawer,
  EmptyState,
  Field,
  GhostButton,
  Modal,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

const statusStyle: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: "new", cls: "border-accent/40 text-accent" },
  contacted: { label: "contacted", cls: "border-warn/40 text-warn" },
  replied: { label: "replied", cls: "border-accent/40 text-accent" },
  qualified: { label: "qualified", cls: "border-accent/40 text-accent" },
  disqualified: { label: "disqualified", cls: "border-edge text-ink-faint" },
  converted: { label: "converted", cls: "border-edge text-ink-faint" },
};

const FILTERS: { id: LeadStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  ...LEAD_STATUSES.map((s) => ({ id: s, label: statusStyle[s].label })),
];

type SortId = "newest" | "oldest" | "name" | "company" | "touched";

const SORTS: { id: SortId; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "name", label: "Name A–Z" },
  { id: "company", label: "Company A–Z" },
  { id: "touched", label: "Last contacted" },
];

const PAGE_SIZE = 100;

function StatusBadge({ status }: { status: LeadStatus }) {
  const s = statusStyle[status];
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Bulk paste parsing (CSV / TSV, header row optional)                 */
/* ------------------------------------------------------------------ */

const HEADER_ALIASES: Record<string, keyof NewLeadInput> = {
  name: "name",
  "full name": "name",
  contact: "name",
  email: "email",
  "email address": "email",
  "e-mail": "email",
  phone: "phone",
  "phone number": "phone",
  tel: "phone",
  role: "role",
  title: "role",
  "job title": "role",
  position: "role",
  company: "company",
  "company name": "company",
  organization: "company",
  organisation: "company",
  website: "website",
  url: "website",
  domain: "website",
  site: "website",
  source: "source",
  notes: "notes",
  note: "notes",
};

/** Column order assumed when the paste has no header row. */
const DEFAULT_COLUMNS: (keyof NewLeadInput)[] = [
  "name",
  "email",
  "company",
  "role",
  "phone",
  "website",
];

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Parse a pasted CSV/TSV blob into lead inputs. Exported for reuse/tests. */
export function parseLeadsPaste(text: string): NewLeadInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const delim = lines[0].includes("\t") ? "\t" : ",";

  const first = splitLine(lines[0], delim);
  // A header row names fields and never contains an email address.
  const isHeader =
    !lines[0].includes("@") &&
    first.some((cell) => HEADER_ALIASES[cell.toLowerCase()] !== undefined);
  const columns: (keyof NewLeadInput | null)[] = isHeader
    ? first.map((cell) => HEADER_ALIASES[cell.toLowerCase()] ?? null)
    : [...DEFAULT_COLUMNS];

  return lines.slice(isHeader ? 1 : 0).map((line) => {
    const cells = splitLine(line, delim);
    const input: NewLeadInput = {};
    columns.forEach((key, i) => {
      const value = cells[i];
      if (!key || !value || key === "tags") return;
      input[key] = value;
    });
    // A one-column paste is just a list of emails or names.
    if (columns.length > 0 && cells.length === 1 && cells[0]) {
      if (cells[0].includes("@")) input.email = cells[0];
      else input.name = cells[0];
    }
    return input;
  });
}

/* ------------------------------------------------------------------ */
/* CSV export                                                          */
/* ------------------------------------------------------------------ */

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function downloadLeadsCsv(leads: Lead[]) {
  const header = [
    "name",
    "email",
    "phone",
    "role",
    "company",
    "website",
    "source",
    "status",
    "tags",
    "notes",
    "last_contacted",
    "added",
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.email,
      l.phone,
      l.role,
      l.company,
      l.website,
      l.source,
      l.status,
      l.tags.join("; "),
      l.notes,
      l.lastContactedAt ? new Date(l.lastContactedAt).toISOString() : "",
      new Date(l.createdAt).toISOString(),
    ]
      .map(csvCell)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...rows].join("\n")], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ImportLeadsModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (note: string) => void;
}) {
  const { state, actions } = useCrm();
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseLeadsPaste(text), [text]);
  const usable = parsed.filter((p) => p.name?.trim() || p.email?.trim());

  // Rows whose email already belongs to a real contact never become leads —
  // they'd just re-prospect people already in the CRM.
  const contactEmails = useMemo(
    () =>
      new Set(
        state.contacts
          .filter((c) => c.email)
          .map((c) => c.email.toLowerCase()),
      ),
    [state.contacts],
  );
  const alreadyContacts = usable.filter((p) =>
    contactEmails.has(p.email?.trim().toLowerCase() ?? ""),
  );
  const importable = usable.filter((p) => !alreadyContacts.includes(p));

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      setText((prev) => (prev.trim() ? `${prev}\n${content}` : content));
      if (!source.trim()) setSource(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file);
  };

  const submit = () => {
    if (importable.length === 0) return;
    const added = actions.addLeads(
      importable.map((p) => ({ ...p, source: p.source || source.trim() })),
    );
    const parts = [`Imported ${added.length} lead${added.length === 1 ? "" : "s"}`];
    const dupes = importable.length - added.length;
    if (dupes > 0) parts.push(`${dupes} duplicate${dupes === 1 ? "" : "s"} skipped`);
    if (alreadyContacts.length > 0)
      parts.push(
        `${alreadyContacts.length} already ${alreadyContacts.length === 1 ? "a contact" : "contacts"}`,
      );
    onDone(`${parts.join(" — ")}.`);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Import leads">
      <div className="space-y-4">
        <Field label="Paste rows (CSV or spreadsheet columns)">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onDrop={(e) => {
              const file = e.dataTransfer.files?.[0];
              if (file) {
                e.preventDefault();
                readFile(file);
              }
            }}
            rows={8}
            placeholder={
              "name,email,company,role\nJane Cooper,jane@acme.com,Acme,Founder"
            }
            className={`${inputCls} min-h-32 font-mono text-xs leading-relaxed`}
          />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-ink-faint">
            Header row optional (name, email, phone, role, company, website,
            source, notes) — without one, columns are read as name, email,
            company, role, phone, website. Duplicate emails are skipped.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) readFile(file);
              e.target.value = "";
            }}
          />
          <GhostButton onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            CSV file
          </GhostButton>
        </div>
        <Field label="Source for this batch">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="LinkedIn list, Apollo export, conference…"
            className={inputCls}
          />
        </Field>

        {importable.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-edge">
            <div className="grid grid-cols-4 gap-2 border-b border-edge bg-surface-2/65 px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-ink-faint">
              <span>Name</span>
              <span>Email</span>
              <span>Company</span>
              <span>Role</span>
            </div>
            {importable.slice(0, 5).map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 border-b border-edge px-3 py-1.5 text-xs text-ink-dim last:border-0"
              >
                <span className="truncate">{p.name || "—"}</span>
                <span className="truncate">{p.email || "—"}</span>
                <span className="truncate">{p.company || "—"}</span>
                <span className="truncate">{p.role || "—"}</span>
              </div>
            ))}
            {importable.length > 5 && (
              <p className="px-3 py-1.5 text-[11px] text-ink-faint">
                +{importable.length - 5} more
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-ink-dim">
            {importable.length > 0
              ? `${importable.length} lead${importable.length === 1 ? "" : "s"} ready${
                  alreadyContacts.length > 0
                    ? ` · ${alreadyContacts.length} already contact${alreadyContacts.length === 1 ? "" : "s"}`
                    : ""
                }`
              : usable.length > 0
                ? "Everyone here is already a contact"
                : "Nothing to import yet"}
          </span>
          <div className="flex gap-2">
            <GhostButton onClick={onClose}>Cancel</GhostButton>
            <PrimaryButton onClick={submit} disabled={importable.length === 0}>
              <ClipboardPaste className="size-4" />
              Import {importable.length > 0 ? importable.length : ""}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function NewLeadModal({ onClose }: { onClose: () => void }) {
  const { actions } = useCrm();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");
  const [source, setSource] = useState("");

  const submit = () => {
    if (!name.trim() && !email.trim()) return;
    actions.addLeads([{ name, email, company, role, website, source }]);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New lead">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Cooper"
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="jane@company.com"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc"
              className={inputCls}
            />
          </Field>
          <Field label="Role">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Founder"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Website">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="acme.com"
              className={inputCls}
            />
          </Field>
          <Field label="Source">
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="LinkedIn"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}>Add lead</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

function EditLeadForm({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  const { actions } = useCrm();
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [role, setRole] = useState(lead.role);
  const [company, setCompany] = useState(lead.company);
  const [website, setWebsite] = useState(lead.website);
  const [source, setSource] = useState(lead.source);
  const [tags, setTags] = useState(lead.tags.join(", "));

  const save = () => {
    if (!name.trim() && !email.trim()) return;
    actions.updateLead(lead.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim(),
      company: company.trim(),
      website: website.trim(),
      source: source.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    onDone();
  };

  return (
    <div className="space-y-4 rounded-xl border border-edge bg-surface-2/65 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Role">
          <input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Website">
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Source">
          <input value={source} onChange={(e) => setSource(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tags (comma-separated)">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="saas, warm"
            className={inputCls}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <GhostButton onClick={onDone}>Cancel</GhostButton>
        <PrimaryButton onClick={save}>
          <Check className="size-4" />
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { state, actions } = useCrm();
  const [note, setNote] = useState(lead.notes);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [followUpAdded, setFollowUpAdded] = useState(false);

  const saveNote = () => {
    if (note === lead.notes) return;
    actions.updateLead(lead.id, { notes: note.trim() });
  };

  const addFollowUp = () => {
    if (followUpAdded) return;
    actions.addTask(
      `Follow up: ${lead.name || lead.email}${lead.company ? ` (${lead.company})` : ""}`,
      Date.now() + 2 * DAY,
    );
    setFollowUpAdded(true);
  };

  /** Prefilled intro mailto — sending flips the lead to contacted. */
  const composeIntro = () => {
    const firstName = lead.name.split(/\s+/)[0] || "there";
    const subject = lead.company
      ? `Quick question about ${lead.company}`
      : "Quick question";
    const body = [
      `Hi ${firstName},`,
      "",
      lead.company
        ? `I came across ${lead.company}${lead.website ? ` (${lead.website})` : ""} and had a quick thought on how you could get more out of your web presence.`
        : "I came across your work and had a quick thought on how you could get more out of your web presence.",
      "",
      "Worth a 15-minute call this week?",
      "",
      `— ${state.workspace.name}`,
    ].join("\n");
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (lead.status === "new") {
      actions.updateLead(lead.id, {
        status: "contacted",
        lastContactedAt: Date.now(),
      });
    }
  };

  return (
    <Drawer open onClose={onClose} title={lead.name || lead.email}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-dim">
            {[lead.role, lead.company].filter(Boolean).join(" · ") ||
              "No company on file"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={lead.status} />
            {lead.source && (
              <span className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-ink-dim">
                {lead.source}
              </span>
            )}
            {lead.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-ink-dim"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => setEditing(!editing)}
            aria-label="Edit lead"
            className={`rounded-lg border p-2 transition ${
              editing
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-edge text-ink-dim hover:text-ink"
            }`}
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              actions.deleteLeads([lead.id]);
              onClose();
            }}
            aria-label={confirmDelete ? "Confirm delete lead" : "Delete lead"}
            className={`rounded-lg border p-2 transition ${
              confirmDelete
                ? "border-danger/50 bg-danger/10 text-danger"
                : "border-edge text-ink-dim hover:text-danger"
            }`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4">
          <EditLeadForm lead={lead} onDone={() => setEditing(false)} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
        {lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-3 text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            <Mail className="size-4 shrink-0" />
            <span className="truncate text-xs">{lead.email}</span>
          </a>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-3 text-ink-faint">
            <Mail className="size-4 shrink-0" />
            <span className="truncate text-xs">No email</span>
          </div>
        )}
        {lead.website ? (
          <a
            href={
              lead.website.startsWith("http")
                ? lead.website
                : `https://${lead.website}`
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-3 text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            <Globe className="size-4 shrink-0" />
            <span className="truncate text-xs">{lead.website}</span>
          </a>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-3 text-ink-dim">
            <Phone className="size-4 shrink-0" />
            <span className="truncate text-xs">{lead.phone || "No phone"}</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <SectionLabel>Status</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LEAD_STATUSES.filter((s) => s !== "converted").map((s) => (
            <button
              key={s}
              onClick={() =>
                actions.updateLead(lead.id, {
                  status: s,
                  ...(s === "contacted" && { lastContactedAt: Date.now() }),
                })
              }
              disabled={lead.status === "converted"}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize transition disabled:pointer-events-none disabled:opacity-50 ${
                lead.status === s
                  ? "border-accent/50 bg-accent-dim text-accent"
                  : "border-edge text-ink-dim hover:text-ink"
              }`}
            >
              {statusStyle[s].label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          {lead.lastContactedAt
            ? `Last contacted ${relTime(lead.lastContactedAt)}.`
            : "Not contacted yet."}{" "}
          Added {relTime(lead.createdAt)}
          {lead.source ? ` from ${lead.source}` : ""}.
        </p>
      </div>

      <div className="mt-6">
        <SectionLabel>Notes</SectionLabel>
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveNote()}
            onBlur={saveNote}
            placeholder="Objections, timing, context…"
            className={inputCls}
          />
          <button
            onClick={saveNote}
            aria-label="Save note"
            className="shrink-0 rounded-xl bg-accent px-3.5 text-black transition hover:brightness-110"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {lead.status === "converted" ? (
          <p className="rounded-xl border border-edge bg-surface-2/50 p-4 text-sm text-ink-dim">
            Converted to a contact — find them in Contacts.
          </p>
        ) : (
          <PrimaryButton
            onClick={() => {
              actions.convertLead(lead.id);
              onClose();
            }}
            className="w-full justify-center"
          >
            <UserRoundCheck className="size-4" />
            Convert to contact
          </PrimaryButton>
        )}
        <div className="grid grid-cols-2 gap-2">
          <GhostButton
            onClick={composeIntro}
            disabled={!lead.email}
            className="justify-center"
          >
            <Mail className="size-4" />
            Compose intro
          </GhostButton>
          <GhostButton
            onClick={addFollowUp}
            disabled={followUpAdded}
            className="justify-center"
          >
            <ListPlus className="size-4" />
            {followUpAdded ? "Follow-up added" : "Follow-up (2d)"}
          </GhostButton>
        </div>
      </div>
    </Drawer>
  );
}

export default function LeadsView() {
  const { state, actions } = useCrm();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [sort, setSort] = useState<SortId>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const [localAdding, setLocalAdding] = useState(false);
  const [localImporting, setLocalImporting] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Command palette requests land here via the store.
  const req = state.ui.openRequest;
  const openId = localOpenId ?? (req?.kind === "lead" ? (req.id ?? null) : null);
  const adding = localAdding || req?.kind === "new-lead";
  const importing = localImporting || req?.kind === "import-leads";
  const clearRequest = () => {
    if (req) actions.requestOpen(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.leads.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    const by: Record<SortId, (a: Lead, b: Lead) => number> = {
      newest: (a, b) => b.createdAt - a.createdAt,
      oldest: (a, b) => a.createdAt - b.createdAt,
      name: (a, b) => (a.name || a.email).localeCompare(b.name || b.email),
      company: (a, b) => a.company.localeCompare(b.company),
      touched: (a, b) => (b.lastContactedAt ?? 0) - (a.lastContactedAt ?? 0),
    };
    return [...list].sort(by[sort]);
  }, [state.leads, query, filter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const open = openId ? state.leads.find((l) => l.id === openId) : null;
  const allVisibleSelected =
    visible.length > 0 && visible.every((l) => selected.has(l.id));

  const resetPage = () => setVisibleCount(PAGE_SIZE);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((l) => next.delete(l.id));
      else visible.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const selectedIds = [...selected].filter((id) =>
    state.leads.some((l) => l.id === id),
  );

  /** Converted is terminal — bulk status changes leave those rows alone. */
  const changeableIds = selectedIds.filter(
    (id) => state.leads.find((l) => l.id === id)?.status !== "converted",
  );

  const bulkStatus = (status: LeadStatus) => {
    actions.updateLeads(changeableIds, {
      status,
      ...(status === "contacted" && { lastContactedAt: Date.now() }),
    });
    setSelected(new Set());
  };

  const bulkConvert = () => {
    for (const id of selectedIds) actions.convertLead(id);
    setSelected(new Set());
  };

  const bulkDelete = () => {
    const n = selectedIds.length;
    if (!window.confirm(`Delete ${n} lead${n === 1 ? "" : "s"}? This can't be undone.`))
      return;
    actions.deleteLeads(selectedIds);
    setSelected(new Set());
  };

  const counts = useMemo(() => {
    const map = new Map<LeadStatus | "all", number>([["all", state.leads.length]]);
    for (const l of state.leads) map.set(l.status, (map.get(l.status) ?? 0) + 1);
    return map;
  }, [state.leads]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Bulk Leads"
        subtitle="Cold-outreach prospects — work the list, convert the winners into contacts."
      >
        <GhostButton
          onClick={() => downloadLeadsCsv(filtered)}
          disabled={filtered.length === 0}
        >
          <Download className="size-4" />
          Export
        </GhostButton>
        <GhostButton onClick={() => setLocalAdding(true)}>
          <Plus className="size-4" />
          New lead
        </GhostButton>
        <PrimaryButton onClick={() => setLocalImporting(true)}>
          <ClipboardPaste className="size-4" />
          Import leads
        </PrimaryButton>
      </PageHeader>

      {importNote && (
        <p className="rounded-xl border border-accent/30 bg-accent-dim px-4 py-3 text-sm text-accent">
          {importNote}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              resetPage();
            }}
            className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${
              filter === f.id
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-edge text-ink-dim hover:text-ink"
            }`}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {counts.get(f.id) ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            placeholder="Search by name, email, company, source or tag…"
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="relative shrink-0">
          <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            aria-label="Sort leads"
            className={`${inputCls} w-auto pl-9 pr-8 text-xs`}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface-2/65 px-4 py-3">
          <span className="mr-auto text-sm text-ink-dim">
            {selectedIds.length} selected
          </span>
          <div className="w-36 shrink-0">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) bulkStatus(e.target.value as LeadStatus);
              }}
              aria-label="Set status for selected leads"
              className={`${inputCls} py-1.5 text-xs`}
            >
              <option value="" disabled>
                Set status…
              </option>
              {LEAD_STATUSES.filter((s) => s !== "converted").map((s) => (
                <option key={s} value={s}>
                  {statusStyle[s].label}
                </option>
              ))}
            </select>
          </div>
          <GhostButton onClick={() => bulkStatus("contacted")}>
            <Send className="size-4" />
            Mark contacted
          </GhostButton>
          <GhostButton onClick={bulkConvert}>
            <UserRoundCheck className="size-4" />
            Convert
          </GhostButton>
          <GhostButton onClick={bulkDelete} className="text-danger">
            <Trash2 className="size-4" />
            Delete
          </GhostButton>
        </div>
      )}

      {filtered.length > 0 ? (
        <Card>
          <div className="flex items-center gap-4 border-b border-edge px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-ink-faint">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              aria-label="Select all visible leads"
              className="size-4 accent-[#34d399]"
            />
            <span className="flex-1">Lead</span>
            <span className="hidden w-36 sm:block">Company</span>
            <span className="hidden w-24 lg:block">Source</span>
            <span className="hidden w-20 md:block">Touched</span>
            <span className="w-24 text-right">Status</span>
          </div>
          <div className="divide-y divide-edge">
            {visible.map((l) => (
              <div
                key={l.id}
                className="flex w-full items-center gap-4 p-4 transition hover:bg-surface-2/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(l.id)}
                  onChange={() => toggle(l.id)}
                  aria-label={`Select ${l.name || l.email}`}
                  className="size-4 shrink-0 accent-[#34d399]"
                />
                <button
                  onClick={() => setLocalOpenId(l.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-medium">
                    {l.name || l.email}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {[l.role, l.email].filter(Boolean).join(" · ") || "—"}
                  </span>
                </button>
                <span className="hidden w-36 shrink-0 truncate text-xs text-ink-dim sm:block">
                  {l.company || "—"}
                </span>
                <span className="hidden w-24 shrink-0 truncate text-xs text-ink-faint lg:block">
                  {l.source || "—"}
                </span>
                <span className="hidden w-20 shrink-0 truncate text-xs tabular-nums text-ink-faint md:block">
                  {l.lastContactedAt ? relTime(l.lastContactedAt) : "—"}
                </span>
                <span className="flex w-24 shrink-0 justify-end">
                  <StatusBadge status={l.status} />
                </span>
              </div>
            ))}
          </div>
          {filtered.length > visible.length && (
            <div className="border-t border-edge p-3 text-center">
              <GhostButton
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visible.length)}{" "}
                more of {filtered.length - visible.length}
              </GhostButton>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          icon={<Target className="size-6" strokeWidth={1.5} />}
          title={query || filter !== "all" ? "No matches" : "No leads yet"}
          hint={
            query || filter !== "all"
              ? "Try a different search or status filter."
              : "Paste a list from LinkedIn, Apollo or a spreadsheet to start outreach."
          }
        >
          {!query && filter === "all" && (
            <PrimaryButton onClick={() => setLocalImporting(true)}>
              <ClipboardPaste className="size-4" />
              Import leads
            </PrimaryButton>
          )}
        </EmptyState>
      )}

      {state.leads.some((l) => l.status === "converted") && (
        <p className="flex items-center gap-1.5 text-xs text-ink-faint">
          <ArrowUpRight className="size-3.5" />
          Converted leads live on as contacts — this list keeps the paper
          trail.
        </p>
      )}

      {open && (
        <LeadDrawer
          lead={open}
          onClose={() => {
            setLocalOpenId(null);
            clearRequest();
          }}
        />
      )}
      {adding && (
        <NewLeadModal
          onClose={() => {
            setLocalAdding(false);
            clearRequest();
          }}
        />
      )}
      {importing && (
        <ImportLeadsModal
          onClose={() => {
            setLocalImporting(false);
            clearRequest();
          }}
          onDone={setImportNote}
        />
      )}
    </div>
  );
}
