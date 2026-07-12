"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { fmtMoney, type Company } from "@/lib/crm/types";
import {
  Avatar,
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

function EditCompanyForm({
  company,
  onDone,
}: {
  company: Company;
  onDone: () => void;
}) {
  const { actions } = useCrm();
  const [name, setName] = useState(company.name);
  const [domain, setDomain] = useState(company.domain);
  const [industry, setIndustry] = useState(company.industry);
  const [location, setLocation] = useState(company.location);
  const [isClient, setIsClient] = useState(company.isClient);
  const [notes, setNotes] = useState(company.notes);

  const save = () => {
    if (!name.trim()) return;
    actions.updateCompany(company.id, {
      name: name.trim(),
      domain: domain.trim(),
      industry: industry.trim(),
      location: location.trim(),
      isClient,
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
        <Field label="Website">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Industry">
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Location">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <Field label="Notes">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-dim">
        <input
          type="checkbox"
          checked={isClient}
          onChange={(e) => setIsClient(e.target.checked)}
          className="size-4 accent-[#34d399]"
        />
        Active client — enables their portal
      </label>
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

function CompanyDrawer({
  company,
  onClose,
}: {
  company: Company;
  onClose: () => void;
}) {
  const { state, actions } = useCrm();
  const { stageById } = useCrmLookups();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const contacts = state.contacts.filter((c) => c.companyId === company.id);
  const deals = state.deals.filter((d) => d.companyId === company.id);
  const openValue = deals
    .filter((d) => stageById.get(d.stageId)?.kind === "open")
    .reduce((s, d) => s + d.value, 0);
  const wonValue = deals
    .filter((d) => stageById.get(d.stageId)?.kind === "won")
    .reduce((s, d) => s + d.value, 0);

  return (
    <Drawer open onClose={onClose} title={company.name}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-dim">
            <span className="flex items-center gap-1.5">
              <Globe className="size-3.5" />
              {company.domain}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {company.location}
            </span>
            {company.isClient && (
              <span className="rounded-full border border-accent/40 bg-accent-dim px-2 py-0.5 text-[11px] font-medium text-accent">
                client
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-ink-faint">{company.industry}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={() => setEditing(!editing)}
            aria-label="Edit company"
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
              actions.deleteCompany(company.id);
              onClose();
            }}
            aria-label={confirmDelete ? "Confirm delete company" : "Delete company"}
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
          <EditCompanyForm company={company} onDone={() => setEditing(false)} />
        </div>
      )}

      {company.notes && (
        <p className="mt-4 rounded-xl border border-edge bg-surface-2/65 p-4 text-base leading-relaxed text-ink-dim">
          {company.notes}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-edge bg-surface-2/50 p-4">
          <p className="font-mono text-lg font-semibold tabular-nums">
            {fmtMoney(openValue)}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">Open pipeline</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface-2/50 p-4">
          <p className="font-mono text-lg font-semibold tabular-nums text-accent">
            {fmtMoney(wonValue)}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">Won revenue</p>
        </div>
      </div>

      <div className="mt-6">
        <SectionLabel>People</SectionLabel>
        <div className="mt-2 space-y-2">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-edge bg-surface-2/50 p-3"
            >
              <Avatar name={c.name} hue={c.hue} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {c.name}
                </span>
                <span className="block truncate text-xs text-ink-faint">
                  {c.role}
                </span>
              </span>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-sm text-ink-faint">No contacts linked yet.</p>
          )}
        </div>
      </div>

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
                  <span className="mt-0.5 block text-xs text-ink-faint">
                    {stage?.name}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-ink-dim">
                  {fmtMoney(d.value)}
                </span>
              </div>
            );
          })}
          {deals.length === 0 && (
            <p className="text-sm text-ink-faint">No deals yet.</p>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function NewCompanyModal({ onClose }: { onClose: () => void }) {
  const { actions } = useCrm();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    actions.addCompany({
      name: name.trim(),
      domain: domain.trim(),
      industry: industry.trim(),
      location: location.trim(),
      isClient: false,
      notes: "",
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New company">
      <div className="space-y-4">
        <Field label="Company name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc."
            className={inputCls}
          />
        </Field>
        <Field label="Website">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="acme.com"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Industry">
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="E-commerce"
              className={inputCls}
            />
          </Field>
          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Austin, TX"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}>Add company</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export default function CompaniesView() {
  const { state, actions } = useCrm();
  const { stageById } = useCrmLookups();
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Command palette requests land here via the store.
  const req = state.ui.openRequest;
  const openId =
    localOpenId ?? (req?.kind === "company" ? (req.id ?? null) : null);
  const clearRequest = () => {
    if (req) actions.requestOpen(null);
  };

  const open = openId ? state.companies.find((c) => c.id === openId) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Companies"
        subtitle={`${state.companies.length} organizations — ${state.companies.filter((c) => c.isClient).length} active clients.`}
      >
        <PrimaryButton onClick={() => setAdding(true)}>
          <Plus className="size-4" />
          New company
        </PrimaryButton>
      </PageHeader>

      {state.companies.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.companies.map((c) => {
            const people = state.contacts.filter(
              (ct) => ct.companyId === c.id,
            ).length;
            const openValue = state.deals
              .filter(
                (d) =>
                  d.companyId === c.id &&
                  stageById.get(d.stageId)?.kind === "open",
              )
              .reduce((s, d) => s + d.value, 0);
            return (
              <button
                key={c.id}
                onClick={() => setLocalOpenId(c.id)}
                className="rounded-2xl border border-edge bg-surface-2/65 p-5 text-left transition hover:border-edge-strong hover:bg-surface-2/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-edge bg-surface-2 text-ink-dim">
                    <Building2 className="size-5" strokeWidth={1.75} />
                  </span>
                  {c.isClient && (
                    <span className="rounded-full border border-accent/40 bg-accent-dim px-2 py-0.5 text-[11px] font-medium text-accent">
                      client
                    </span>
                  )}
                </div>
                <p className="mt-3 truncate text-[15px] font-medium">{c.name}</p>
                <p className="truncate text-xs text-ink-faint">{c.industry}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-dim">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {people}
                  </span>
                  <span className="font-mono tabular-nums">
                    {openValue > 0 ? fmtMoney(openValue) : "—"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="size-6" strokeWidth={1.5} />}
          title="No companies yet"
          hint="Companies group your contacts and deals into accounts."
        >
          <PrimaryButton onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            New company
          </PrimaryButton>
        </EmptyState>
      )}

      {open && (
        <CompanyDrawer
          company={open}
          onClose={() => {
            setLocalOpenId(null);
            clearRequest();
          }}
        />
      )}
      {adding && <NewCompanyModal onClose={() => setAdding(false)} />}
    </div>
  );
}
