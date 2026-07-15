"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  Download,
  Kanban,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { downloadCsv } from "@/lib/crm/csv";
import {
  fmtMoney,
  relTime,
  type Contact,
} from "@/lib/crm/types";
import {
  Avatar,
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

function EditContactForm({
  contact,
  onDone,
}: {
  contact: Contact;
  onDone: () => void;
}) {
  const { state, actions } = useCrm();
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone);
  const [role, setRole] = useState(contact.role);
  const [companyId, setCompanyId] = useState(contact.companyId ?? "");
  const [notes, setNotes] = useState(contact.notes);

  const save = () => {
    if (!name.trim()) return;
    actions.updateContact(contact.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim(),
      companyId: companyId || null,
      notes,
    });
    onDone();
  };

  return (
    <div className="space-y-4 rounded-xl border border-edge bg-surface-2/65 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Role">
          <input value={role} onChange={(e) => setRole(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Company">
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className={inputCls}
        >
          <option value="">None</option>
          {state.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </Field>
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

function ContactDrawer({
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
  const { state, actions } = useCrm();
  const { companyById, stageById } = useCrmLookups();
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const company = contact.companyId
    ? companyById.get(contact.companyId)
    : null;

  const deals = state.deals.filter((d) => d.contactId === contact.id);
  const tasks = state.tasks.filter((t) => t.contactId === contact.id && !t.done);
  const timeline = state.activities
    .filter((a) => a.contactId === contact.id)
    .sort((a, b) => b.at - a.at);

  const logNote = () => {
    if (!note.trim()) return;
    actions.logActivity({
      type: "note",
      summary: note.trim(),
      contactId: contact.id,
      companyId: contact.companyId,
      dealId: deals[0]?.id ?? null,
    });
    setNote("");
  };

  return (
    <Drawer open onClose={onClose} title={contact.name}>
      <div className="flex items-start gap-4">
        <Avatar name={contact.name} hue={contact.hue} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-dim">{contact.role}</p>
          {company && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-dim">
              <Building2 className="size-3.5" />
              {company.name}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {contact.tags.map((t) => (
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
            aria-label="Edit contact"
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
              actions.deleteContact(contact.id);
              onClose();
            }}
            aria-label={confirmDelete ? "Confirm delete contact" : "Delete contact"}
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
          <EditContactForm contact={contact} onDone={() => setEditing(false)} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-3 text-ink-dim transition hover:border-edge-strong hover:text-ink"
        >
          <Mail className="size-4 shrink-0" />
          <span className="truncate text-xs">{contact.email}</span>
        </a>
        <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-3 text-ink-dim">
          <Phone className="size-4 shrink-0" />
          <span className="truncate text-xs">{contact.phone}</span>
        </div>
      </div>

      {contact.notes && (
        <p className="mt-4 rounded-xl border border-edge bg-surface-2/65 p-4 text-base leading-relaxed text-ink-dim">
          {contact.notes}
        </p>
      )}

      {deals.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Deals</SectionLabel>
          <div className="mt-2 space-y-2">
            {deals.map((d) => {
              const stage = stageById.get(d.stageId);
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-surface-2/50 p-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {d.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
                      <Kanban className="size-3" />
                      {stage?.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ink-dim">
                    {fmtMoney(d.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Open tasks</SectionLabel>
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
          </div>
        </div>
      )}

      <div className="mt-6">
        <SectionLabel>Log a note</SectionLabel>
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && logNote()}
            placeholder="Called about the proposal…"
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

      <div className="mt-6">
        <SectionLabel>Timeline</SectionLabel>
        <div className="mt-2 divide-y divide-edge">
          {timeline.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-3">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-ink-faint" />
              <div className="min-w-0">
                <p className="text-sm leading-relaxed">{a.summary}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {a.type} · {relTime(a.at)}
                </p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="py-4 text-sm text-ink-faint">
              No activity yet — log the first touch above.
            </p>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function NewContactModal({ onClose }: { onClose: () => void }) {
  const { state, actions } = useCrm();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    actions.addContact({
      name: name.trim(),
      email: email.trim(),
      phone: "",
      role: role.trim(),
      companyId: companyId || null,
      tags: ["lead"],
      notes: "",
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New contact">
      <div className="space-y-4">
        <Field label="Full name">
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Founder"
              className={inputCls}
            />
          </Field>
          <Field label="Company">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputCls}
            >
              <option value="">None</option>
              {state.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}>Add contact</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export default function ContactsView() {
  const { state, actions } = useCrm();
  const { companyById } = useCrmLookups();
  const [query, setQuery] = useState("");
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const [localAdding, setLocalAdding] = useState(false);

  // Command palette requests land here via the store.
  const req = state.ui.openRequest;
  const openId =
    localOpenId ?? (req?.kind === "contact" ? (req.id ?? null) : null);
  const adding = localAdding || req?.kind === "new-contact";
  const clearRequest = () => {
    if (req) actions.requestOpen(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.contacts;
    return state.contacts.filter((c) => {
      const company = c.companyId ? companyById.get(c.companyId) : null;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        (company?.name.toLowerCase().includes(q) ?? false) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.contacts, query, companyById]);

  const open = openId ? state.contacts.find((c) => c.id === openId) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Contacts"
        subtitle={`${state.contacts.length} people across ${state.companies.length} companies.`}
      >
        <GhostButton
          onClick={() =>
            downloadCsv(
              "contacts",
              ["name", "email", "phone", "role", "company", "tags", "notes", "added"],
              filtered.map((c) => [
                c.name,
                c.email,
                c.phone,
                c.role,
                (c.companyId && companyById.get(c.companyId)?.name) || "",
                c.tags.join("; "),
                c.notes,
                new Date(c.createdAt).toISOString(),
              ]),
            )
          }
          disabled={filtered.length === 0}
        >
          <Download className="size-4" />
          Export
        </GhostButton>
        <PrimaryButton onClick={() => setLocalAdding(true)}>
          <Plus className="size-4" />
          New contact
        </PrimaryButton>
      </PageHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, company, role or tag…"
          className={`${inputCls} pl-10`}
        />
      </div>

      {filtered.length > 0 ? (
        <Card className="divide-y divide-edge">
          {filtered.map((c) => {
            const company = c.companyId ? companyById.get(c.companyId) : null;
            const openDeals = state.deals.filter(
              (d) => d.contactId === c.id && !d.closedAt,
            );
            return (
              <button
                key={c.id}
                onClick={() => setLocalOpenId(c.id)}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-surface-2/50"
              >
                <Avatar name={c.name} hue={c.hue} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {c.name}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {c.role}
                    {company ? ` · ${company.name}` : ""}
                  </span>
                </span>
                <span className="hidden shrink-0 gap-1.5 sm:flex">
                  {c.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-ink-dim"
                    >
                      {t}
                    </span>
                  ))}
                </span>
                <span className="hidden w-24 shrink-0 text-right font-mono text-xs tabular-nums text-ink-dim md:block">
                  {openDeals.length > 0
                    ? fmtMoney(openDeals.reduce((s, d) => s + d.value, 0))
                    : "—"}
                </span>
              </button>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          icon={<Users className="size-6" strokeWidth={1.5} />}
          title={query ? "No matches" : "No contacts yet"}
          hint={
            query
              ? "Try a different name, company or tag."
              : "Add your first contact to start building the directory."
          }
        >
          {!query && (
            <PrimaryButton onClick={() => setLocalAdding(true)}>
              <Plus className="size-4" />
              New contact
            </PrimaryButton>
          )}
        </EmptyState>
      )}

      {open && (
        <ContactDrawer
          contact={open}
          onClose={() => {
            setLocalOpenId(null);
            clearRequest();
          }}
        />
      )}
      {adding && (
        <NewContactModal
          onClose={() => {
            setLocalAdding(false);
            clearRequest();
          }}
        />
      )}
    </div>
  );
}
