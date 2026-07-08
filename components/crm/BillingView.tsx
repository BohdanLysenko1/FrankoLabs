"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Plus, Receipt } from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { DAY, fmtDate, fmtMoney, type Invoice } from "@/lib/crm/types";
import {
  Card,
  Field,
  GhostButton,
  Modal,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

function InvoiceRow({ invoice, now }: { invoice: Invoice; now: number }) {
  const { actions } = useCrm();
  const { companyById } = useCrmLookups();
  const company = companyById.get(invoice.companyId);
  const overdue = invoice.status === "due" && invoice.dueAt < now;

  return (
    <div className="flex items-center gap-3.5 p-4">
      <Receipt className="size-4 shrink-0 text-ink-faint" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {invoice.number}
          <span className="ml-2 font-normal text-ink-dim">{invoice.label}</span>
        </p>
        <p className="truncate text-xs text-ink-faint">
          {company?.name ?? "—"} · issued {fmtDate(invoice.issuedAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm tabular-nums">
          {fmtMoney(invoice.amount)}
        </p>
        <p
          className={`text-[11px] font-medium ${
            invoice.status === "paid"
              ? "text-accent"
              : overdue
                ? "text-danger"
                : "text-warn"
          }`}
        >
          {invoice.status === "paid"
            ? `paid · ${fmtDate(invoice.paidAt ?? invoice.issuedAt)}`
            : `${overdue ? "overdue" : "due"} · ${fmtDate(invoice.dueAt)}`}
        </p>
      </div>
      {invoice.status === "due" && (
        <GhostButton onClick={() => actions.payInvoice(invoice.id)}>
          <Check className="size-3.5" />
          Mark paid
        </GhostButton>
      )}
    </div>
  );
}

export default function BillingView() {
  const { state, actions } = useCrm();
  const [now] = useState(() => Date.now());
  const clients = state.companies.filter((c) => c.isClient);

  const [creating, setCreating] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const { outstanding, paid, collected30d } = useMemo(() => {
    const due = state.invoices.filter((i) => i.status === "due");
    const paidList = state.invoices.filter((i) => i.status === "paid");
    return {
      outstanding: due.reduce((s, i) => s + i.amount, 0),
      paid: paidList,
      collected30d: paidList
        .filter((i) => (i.paidAt ?? 0) > now - 30 * DAY)
        .reduce((s, i) => s + i.amount, 0),
    };
  }, [state.invoices, now]);

  const dueInvoices = state.invoices
    .filter((i) => i.status === "due")
    .sort((a, b) => a.dueAt - b.dueAt);
  const paidInvoices = paid.sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!companyId || !label.trim() || !Number.isFinite(value) || value <= 0)
      return;
    actions.addInvoice({ companyId, label: label.trim(), amount: value });
    setCreating(false);
    setLabel("");
    setAmount("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <PageHeader
        title="Billing & invoices"
        subtitle="Invoices flow from deals and contracts; clients pay from their portal and the numbers update here instantly."
      >
        <PrimaryButton onClick={() => { setCompanyId(clients[0]?.id ?? ""); setCreating(true); }}>
          <Plus className="size-4" />
          New invoice
        </PrimaryButton>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className={`text-xl font-semibold tabular-nums ${outstanding > 0 ? "text-warn" : "text-accent"}`}>
            {fmtMoney(outstanding)}
          </p>
          <p className="mt-1 text-xs text-ink-dim">outstanding</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-semibold tabular-nums text-accent">
            {fmtMoney(collected30d)}
          </p>
          <p className="mt-1 text-xs text-ink-dim">collected · last 30 days</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-semibold tabular-nums">
            {fmtMoney(paid.reduce((s, i) => s + i.amount, 0))}
          </p>
          <p className="mt-1 text-xs text-ink-dim">collected · all time</p>
        </Card>
      </div>

      <div>
        <SectionLabel>Outstanding</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {dueInvoices.map((i) => (
            <InvoiceRow key={i.id} invoice={i} now={now} />
          ))}
          {dueInvoices.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">
              Nothing outstanding — everything on record is paid.
            </p>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Paid</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {paidInvoices.slice(0, 12).map((i) => (
            <InvoiceRow key={i.id} invoice={i} now={now} />
          ))}
          {paidInvoices.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">No payments yet.</p>
          )}
        </Card>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New invoice">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Client">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputCls}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="What's it for?">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. SEO retainer — August"
              className={inputCls}
            />
          </Field>
          <Field label="Amount (USD)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <PrimaryButton type="submit" className="w-full justify-center">
            Issue invoice — due in 14 days
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
