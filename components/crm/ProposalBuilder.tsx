"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  FileText,
  Plus,
  Printer,
  Send,
  Trash2,
  X,
} from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
import { fmtMoney, relTime, type Company } from "@/lib/crm/types";
import {
  SERVICE_CATALOG,
  emptyProposal,
  lineTotal,
  loadProposals,
  proposalNumber,
  proposalTotals,
  saveProposals,
  serviceById,
  type Proposal,
  type ProposalLine,
} from "@/lib/proposals";
import {
  Card,
  EmptyState,
  Field,
  GhostButton,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

const STANDARD_TERMS = [
  "50% of one-time fees invoiced on signature, balance on delivery.",
  "Recurring services bill monthly and can be cancelled with 30 days notice.",
  "Scope changes are quoted before work starts.",
  "This proposal is valid for 30 days from the date above.",
];

function fmtDateLong(at: number): string {
  return new Date(at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ProposalDocument({
  proposal,
  company,
}: {
  proposal: Proposal;
  company: Company | null;
}) {
  const totals = proposalTotals(proposal);
  const preparedFor = proposal.preparedFor || company?.name || "—";

  return (
    <div className="proposal-paper overflow-hidden rounded-xl bg-white text-zinc-900 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between gap-4 bg-zinc-950 px-8 py-6 text-white">
        <div className="flex items-center gap-3">
          <LogoMark className="h-8 w-auto" />
          <div>
            <p className="text-sm font-semibold tracking-tight">Franko Labs</p>
            <p className="text-[11px] text-zinc-400">frankolabs.com</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-zinc-400">
            {proposalNumber(proposal)}
          </p>
          <p className="text-[11px] text-zinc-400">
            {fmtDateLong(proposal.updatedAt)}
          </p>
        </div>
      </div>

      <div className="space-y-6 px-8 py-7">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Proposal
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            {proposal.title || "Untitled proposal"}
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Prepared for <span className="font-medium text-zinc-800">{preparedFor}</span>
            {company?.location ? ` · ${company.location}` : ""}
          </p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              <th className="pb-2 font-medium">Service</th>
              <th className="pb-2 text-right font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Unit</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {proposal.lines.map((line) => {
              const service = serviceById.get(line.serviceId);
              if (!service) return null;
              return (
                <tr key={line.serviceId} className="border-b border-zinc-100">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-zinc-500">
                      {service.billing === "monthly" ? "recurring · monthly" : "one-time"}
                      {line.discountPct > 0 ? ` · ${line.discountPct}% off` : ""}
                    </p>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {line.qty}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {fmtMoney(line.unitPrice)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {fmtMoney(lineTotal(line))}
                    {service.billing === "monthly" ? (
                      <span className="text-xs text-zinc-400">/mo</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {proposal.lines.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-sm text-zinc-400">
                  No services selected yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="ml-auto w-full max-w-64 space-y-1.5 text-sm">
          {proposal.globalDiscountPct > 0 && (
            <div className="flex justify-between text-zinc-500">
              <span>Discount ({proposal.globalDiscountPct}%)</span>
              <span className="font-mono tabular-nums">
                −{fmtMoney(totals.discount)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">One-time total</span>
            <span className="font-mono font-medium tabular-nums">
              {fmtMoney(totals.oneTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Monthly recurring</span>
            <span className="font-mono font-medium tabular-nums">
              {fmtMoney(totals.monthly)}/mo
            </span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-base font-semibold">
            <span>Due on acceptance</span>
            <span className="font-mono tabular-nums">
              {fmtMoney(totals.firstInvoice)}
            </span>
          </div>
        </div>

        {proposal.notes.trim() && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Notes
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
              {proposal.notes}
            </p>
          </div>
        )}

        <div className="border-t border-zinc-200 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            Terms
          </p>
          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-zinc-500">
            {STANDARD_TERMS.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-zinc-400">
            Franko Labs · frankolabs.com · Everything your business needs, one
            connected system.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProposalBuilder({
  onRequestConsumed,
  onSent,
}: {
  onRequestConsumed: () => void;
  onSent: () => void;
}) {
  const { state, actions } = useCrm();
  const [proposals, setProposals] = useState<Proposal[]>(loadProposals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    saveProposals(proposals);
  }, [proposals]);

  // Consume a palette "New proposal" request once the builder is on screen.
  const req = state.ui.openRequest;
  useEffect(() => {
    if (req?.kind !== "new-proposal") return;
    const start = () => {
      const draft = emptyProposal();
      setProposals((prev) => [draft, ...prev]);
      setEditingId(draft.id);
      setSent(false);
    };
    start();
    onRequestConsumed();
    actions.requestOpen(null);
  }, [req, actions, onRequestConsumed]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const timer = setTimeout(() => window.print(), 60);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const editing = proposals.find((p) => p.id === editingId) ?? null;
  const company = editing?.companyId
    ? state.companies.find((c) => c.id === editing.companyId) ?? null
    : null;
  const totals = useMemo(
    () => (editing ? proposalTotals(editing) : null),
    [editing],
  );

  const update = (patch: Partial<Proposal>) => {
    if (!editingId) return;
    setSent(false);
    setProposals((prev) =>
      prev.map((p) =>
        p.id === editingId ? { ...p, ...patch, updatedAt: Date.now() } : p,
      ),
    );
  };

  const startNew = () => {
    const draft = emptyProposal();
    setProposals((prev) => [draft, ...prev]);
    setEditingId(draft.id);
    setSent(false);
  };

  const addService = (serviceId: string) => {
    if (!editing) return;
    const existing = editing.lines.find((l) => l.serviceId === serviceId);
    const service = serviceById.get(serviceId);
    if (!service) return;
    update({
      lines: existing
        ? editing.lines.map((l) =>
            l.serviceId === serviceId ? { ...l, qty: l.qty + 1 } : l,
          )
        : [
            ...editing.lines,
            {
              serviceId,
              qty: 1,
              unitPrice: service.basePrice,
              discountPct: 0,
            },
          ],
    });
  };

  const updateLine = (serviceId: string, patch: Partial<ProposalLine>) => {
    if (!editing) return;
    update({
      lines: editing.lines.map((l) =>
        l.serviceId === serviceId ? { ...l, ...patch } : l,
      ),
    });
  };

  const removeLine = (serviceId: string) => {
    if (!editing) return;
    update({ lines: editing.lines.filter((l) => l.serviceId !== serviceId) });
  };

  const deleteDraft = () => {
    if (!editingId) return;
    setProposals((prev) => prev.filter((p) => p.id !== editingId));
    setEditingId(null);
  };

  const sendAsContract = () => {
    if (!editing || !editing.companyId || !totals || editing.lines.length === 0)
      return;
    const serviceNames = editing.lines
      .map((l) => serviceById.get(l.serviceId)?.name)
      .filter(Boolean)
      .join(", ");
    actions.sendContract({
      companyId: editing.companyId,
      title: editing.title || "Service proposal",
      summary: `${serviceNames}. ${fmtMoney(totals.oneTime)} one-time${
        totals.monthly > 0 ? ` + ${fmtMoney(totals.monthly)}/mo recurring` : ""
      }${editing.globalDiscountPct > 0 ? ` (includes ${editing.globalDiscountPct}% discount)` : ""}.`,
      amount: totals.firstInvoice,
      terms: STANDARD_TERMS.slice(0, 3),
    });
    setSent(true);
    onSent();
  };

  const numberInput = (
    value: number,
    onChange: (n: number) => void,
    className: string,
    max?: number,
  ) => (
    <input
      value={String(value)}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (!Number.isFinite(n)) return;
        onChange(Math.max(0, max !== undefined ? Math.min(max, n) : n));
      }}
      inputMode="numeric"
      className={`${inputCls} ${className} px-2 py-1.5 text-right font-mono tabular-nums`}
    />
  );

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionLabel>Drafts</SectionLabel>
          <PrimaryButton onClick={startNew}>
            <Plus className="size-4" />
            New proposal
          </PrimaryButton>
        </div>
        {proposals.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-6" strokeWidth={1.5} />}
            title="No proposals yet"
            hint="Pick services from the catalog, set quantities and discounts, and export a branded PDF — or send it as a contract."
          >
            <PrimaryButton onClick={startNew}>
              <Plus className="size-4" />
              Start a proposal
            </PrimaryButton>
          </EmptyState>
        ) : (
          <Card className="divide-y divide-edge">
            {proposals.map((p) => {
              const t = proposalTotals(p);
              const c = p.companyId
                ? state.companies.find((co) => co.id === p.companyId)
                : null;
              return (
                <button
                  key={p.id}
                  onClick={() => setEditingId(p.id)}
                  className="flex w-full items-center gap-3.5 p-4 text-left transition hover:bg-surface-2/60"
                >
                  <FileText className="size-4 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate text-xs text-ink-faint">
                      {p.preparedFor || c?.name || "No client yet"} ·{" "}
                      {p.lines.length} service{p.lines.length === 1 ? "" : "s"} ·
                      edited {relTime(p.updatedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-ink-dim">
                    {fmtMoney(t.oneTime)}
                    {t.monthly > 0 ? ` + ${fmtMoney(t.monthly)}/mo` : ""}
                  </span>
                </button>
              );
            })}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GhostButton onClick={() => setEditingId(null)}>
          <ArrowLeft className="size-4" />
          All proposals
        </GhostButton>
        <div className="flex items-center gap-2">
          <GhostButton onClick={deleteDraft} className="text-danger">
            <Trash2 className="size-4" />
            Delete
          </GhostButton>
          <GhostButton
            onClick={() => setPrinting(true)}
            className={editing.lines.length === 0 ? "pointer-events-none opacity-50" : ""}
          >
            <Printer className="size-4" />
            Export PDF
          </GhostButton>
          <PrimaryButton
            onClick={sendAsContract}
            className={
              !editing.companyId || editing.lines.length === 0 || sent
                ? "pointer-events-none opacity-50"
                : ""
            }
          >
            {sent ? <Check className="size-4" /> : <Send className="size-4" />}
            {sent ? "Sent for signature" : "Send as contract"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <Field label="Proposal title">
              <input
                value={editing.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Website redesign & growth retainer"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client">
                <select
                  value={editing.companyId ?? ""}
                  onChange={(e) => {
                    const next = state.companies.find(
                      (c) => c.id === e.target.value,
                    );
                    update({
                      companyId: next?.id ?? null,
                      preparedFor: next?.name ?? editing.preparedFor,
                    });
                  }}
                  className={inputCls}
                >
                  <option value="">Select a company…</option>
                  {state.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prepared for">
                <input
                  value={editing.preparedFor}
                  onChange={(e) => update({ preparedFor: e.target.value })}
                  placeholder="Client or contact name"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <div>
            <SectionLabel>Service catalog</SectionLabel>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SERVICE_CATALOG.map((service) => {
                const selected = editing.lines.some(
                  (l) => l.serviceId === service.id,
                );
                return (
                  <button
                    key={service.id}
                    onClick={() => addService(service.id)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      selected
                        ? "border-accent/50 bg-accent-dim"
                        : "border-edge bg-surface-2/40 hover:border-edge-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {service.name}
                      </p>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-ink-dim">
                        {fmtMoney(service.basePrice)}
                        {service.billing === "monthly" ? "/mo" : ""}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-faint">
                      {service.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <SectionLabel>Line items</SectionLabel>
            <Card className="mt-3 divide-y divide-edge">
              {editing.lines.map((line) => {
                const service = serviceById.get(line.serviceId);
                if (!service) return null;
                return (
                  <div
                    key={line.serviceId}
                    className="flex flex-wrap items-center gap-3 p-3.5"
                  >
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="truncate text-sm font-medium">
                        {service.name}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {service.billing === "monthly"
                          ? "monthly"
                          : "one-time"}{" "}
                        · per {service.unit}
                      </p>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-ink-faint">
                      qty
                      {numberInput(
                        line.qty,
                        (n) => updateLine(line.serviceId, { qty: n }),
                        "w-14",
                        99,
                      )}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink-faint">
                      $
                      {numberInput(
                        line.unitPrice,
                        (n) => updateLine(line.serviceId, { unitPrice: n }),
                        "w-24",
                      )}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-ink-faint">
                      −%
                      {numberInput(
                        line.discountPct,
                        (n) => updateLine(line.serviceId, { discountPct: n }),
                        "w-14",
                        100,
                      )}
                    </label>
                    <span className="w-24 text-right font-mono text-sm tabular-nums">
                      {fmtMoney(lineTotal(line))}
                      {service.billing === "monthly" ? (
                        <span className="text-xs text-ink-faint">/mo</span>
                      ) : null}
                    </span>
                    <button
                      aria-label={`Remove ${service.name}`}
                      onClick={() => removeLine(line.serviceId)}
                      className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-2 hover:text-danger"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
              {editing.lines.length === 0 && (
                <p className="p-5 text-sm text-ink-faint">
                  Add services from the catalog above.
                </p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Global discount %">
              {numberInput(
                editing.globalDiscountPct,
                (n) => update({ globalDiscountPct: n }),
                "w-full",
                100,
              )}
            </Field>
            <Field label="Notes (shown on the proposal)">
              <textarea
                value={editing.notes}
                onChange={(e) => update({ notes: e.target.value })}
                rows={3}
                placeholder="Timeline, assumptions, what happens after acceptance…"
                className={`${inputCls} os-scroll resize-none`}
              />
            </Field>
          </div>

          <p className="text-xs text-ink-faint">
            Drafts save automatically to this browser. Sending as a contract
            drops it into the client&apos;s portal for signature.
          </p>
        </div>

        <div className="space-y-3 xl:sticky xl:top-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Preview</SectionLabel>
            {totals && (
              <span className="font-mono text-xs tabular-nums text-ink-dim">
                {fmtMoney(totals.oneTime)}
                {totals.monthly > 0 ? ` + ${fmtMoney(totals.monthly)}/mo` : ""}
              </span>
            )}
          </div>
          <ProposalDocument proposal={editing} company={company} />
        </div>
      </div>

      {printing &&
        createPortal(
          <div className="proposal-print">
            <ProposalDocument proposal={editing} company={company} />
          </div>,
          document.body,
        )}
    </div>
  );
}
