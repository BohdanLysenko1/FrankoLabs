"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  BellRing,
  Check,
  Pause,
  Pencil,
  Play,
  Plus,
  Receipt,
  RefreshCw,
  Timer,
  Trash2,
  Zap,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import {
  DAY,
  fmtDate,
  fmtMinutes,
  fmtMoney,
  invoiceBalance,
  invoiceOverdue,
  retainerPeriodStart,
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type PaymentMethod,
  type Retainer,
} from "@/lib/crm/types";
import TimeLogModal from "./TimeLogModal";
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

function InvoiceRow({
  invoice,
  now,
  onRecord,
}: {
  invoice: Invoice;
  now: number;
  onRecord: () => void;
}) {
  const { state, actions } = useCrm();
  const { companyById } = useCrmLookups();
  const company = companyById.get(invoice.companyId);
  const overdue = invoiceOverdue(invoice, now);
  const balance = invoiceBalance(invoice, state.payments);
  const payments = state.payments.filter((p) => p.invoiceId === invoice.id);
  const [reminded, setReminded] = useState(false);

  const remind = () => {
    if (reminded) return;
    actions.sendInvoiceReminder(invoice.id);
    setReminded(true);
  };

  const statusLine =
    invoice.status === "paid"
      ? `paid · ${fmtDate(invoice.paidAt ?? invoice.issuedAt)}`
      : invoice.status === "partial"
        ? `${overdue ? "overdue" : "partial"} · ${fmtMoney(balance)} left · due ${fmtDate(invoice.dueAt)}`
        : `${overdue ? "overdue" : "due"} · ${fmtDate(invoice.dueAt)}`;

  return (
    <div>
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
            {statusLine}
          </p>
        </div>
        {invoice.status !== "paid" && (
          <div className="flex shrink-0 items-center gap-1.5">
            <GhostButton
              onClick={remind}
              disabled={reminded}
              className={overdue ? "text-warn" : ""}
            >
              <BellRing className="size-3.5" />
              {reminded ? "Reminder sent" : "Remind"}
            </GhostButton>
            <GhostButton onClick={onRecord}>
              <Plus className="size-3.5" />
              Record payment
            </GhostButton>
            <GhostButton onClick={() => actions.payInvoice(invoice.id)}>
              <Check className="size-3.5" />
              Mark paid
            </GhostButton>
          </div>
        )}
      </div>
      {payments.length > 0 && (
        <div className="space-y-1 px-4 pb-3 pl-11">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 text-xs text-ink-dim"
            >
              <Check className="size-3 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 truncate">
                {fmtMoney(p.amount)} · {PAYMENT_METHOD_LABELS[p.method]} ·{" "}
                {fmtDate(p.paidOn)}
                {p.reference ? ` · ${p.reference}` : ""}
              </span>
              <button
                type="button"
                onClick={() => actions.deletePayment(p.id)}
                title="Remove payment"
                className="text-ink-faint transition hover:text-danger"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordPaymentModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const { state, actions } = useCrm();
  const balance = invoiceBalance(invoice, state.payments);
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<PaymentMethod>("bank-transfer");
  const [paidOn, setPaidOn] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reference, setReference] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value <= 0) return;
    actions.recordPayment({
      invoiceId: invoice.id,
      amount: value,
      method,
      paidOn: new Date(`${paidOn}T12:00:00`).getTime(),
      reference,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={`Record payment — ${invoice.number}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Amount (balance ${fmtMoney(balance)})`}>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Method">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className={inputCls}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Received on">
            <input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Reference (optional)">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Wire ref, check #…"
              className={inputCls}
            />
          </Field>
        </div>
        <PrimaryButton type="submit" className="w-full justify-center">
          Record payment
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function RetainerRow({
  retainer,
  onEdit,
  now,
}: {
  retainer: Retainer;
  onEdit: () => void;
  now: number;
}) {
  const { state, actions } = useCrm();
  const { companyById } = useCrmLookups();
  const company = companyById.get(retainer.companyId);
  const [billed, setBilled] = useState(false);

  // Hours burned since the last billing day.
  const periodStart = retainerPeriodStart(retainer.billingDay, now);
  const usedMinutes = state.timeEntries
    .filter(
      (t) =>
        t.retainerId === retainer.id &&
        t.billable &&
        t.entryDate >= periodStart,
    )
    .reduce((s, t) => s + t.minutes, 0);
  const includedMinutes = retainer.includedHours * 60;
  const pct =
    includedMinutes > 0 ? Math.min(1, usedMinutes / includedMinutes) : 0;
  const over = includedMinutes > 0 && usedMinutes > includedMinutes;

  return (
    <div className={`p-4 ${retainer.active ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <RefreshCw className="size-4 shrink-0 text-ink-faint" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {retainer.name}
            <span className="ml-2 font-normal text-ink-dim">
              {company?.name ?? "—"}
            </span>
          </p>
          <p className="truncate text-xs text-ink-faint">
            {fmtMoney(retainer.amount)}/mo ·{" "}
            {retainer.active
              ? retainer.autoInvoice && retainer.nextInvoiceOn
                ? `next invoice ${fmtDate(retainer.nextInvoiceOn)}`
                : "invoiced manually"
              : "paused"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {retainer.active && (
            <GhostButton
              onClick={() => {
                if (billed) return;
                actions.billRetainer(retainer.id);
                setBilled(true);
              }}
              disabled={billed}
            >
              <Zap className="size-3.5" />
              {billed ? "Invoiced" : "Bill now"}
            </GhostButton>
          )}
          <GhostButton
            onClick={() =>
              actions.saveRetainer({ ...retainer, active: !retainer.active })
            }
            title={retainer.active ? "Pause" : "Resume"}
          >
            {retainer.active ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </GhostButton>
          <GhostButton onClick={onEdit} title="Edit">
            <Pencil className="size-3.5" />
          </GhostButton>
        </div>
      </div>
      {retainer.includedHours > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className={`h-full rounded-full ${over ? "bg-danger" : "bg-accent"}`}
              style={{ width: `${Math.max(2, pct * 100)}%` }}
            />
          </div>
          <p
            className={`shrink-0 text-xs tabular-nums ${over ? "text-danger" : "text-ink-dim"}`}
          >
            {fmtMinutes(usedMinutes)} / {retainer.includedHours}h this period
          </p>
        </div>
      )}
    </div>
  );
}

function RetainerModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Retainer | null;
}) {
  const { state, actions } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);
  const [companyId, setCompanyId] = useState(editing?.companyId ?? "");
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [hours, setHours] = useState(
    editing ? String(editing.includedHours) : "10",
  );
  const [billingDay, setBillingDay] = useState(
    editing ? String(editing.billingDay) : "1",
  );
  const [autoInvoice, setAutoInvoice] = useState(editing?.autoInvoice ?? true);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!companyId || !name.trim() || !Number.isFinite(value) || value <= 0)
      return;
    actions.saveRetainer({
      id: editing?.id,
      companyId,
      name: name.trim(),
      amount: value,
      includedHours: Math.max(0, Number(hours) || 0),
      billingDay: Math.min(28, Math.max(1, Number(billingDay) || 1)),
      autoInvoice,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit retainer" : "New retainer"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Client">
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className={inputCls}
          >
            <option value="">Pick a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SEO retainer"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Monthly (USD)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Included hours">
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Billing day">
            <input
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-ink-dim">
          <input
            type="checkbox"
            checked={autoInvoice}
            onChange={(e) => setAutoInvoice(e.target.checked)}
            className="size-4 accent-[#34d399]"
          />
          Generate the invoice automatically on the billing day
        </label>
        <div className="flex gap-2">
          <PrimaryButton type="submit" className="flex-1 justify-center">
            {editing ? "Save retainer" : "Create retainer"}
          </PrimaryButton>
          {editing && (
            <GhostButton
              type="button"
              className="text-danger"
              onClick={() => {
                actions.deleteRetainer(editing.id);
                onClose();
              }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </GhostButton>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default function BillingView() {
  const { state, actions } = useCrm();
  const { companyById } = useCrmLookups();
  const [now] = useState(() => Date.now());
  const clients = state.companies.filter((c) => c.isClient);

  const [creating, setCreating] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDays, setDueDays] = useState("14");
  const [dealId, setDealId] = useState("");

  const [retainerModal, setRetainerModal] = useState<
    { open: false } | { open: true; editing: Retainer | null }
  >({ open: false });
  const [loggingTime, setLoggingTime] = useState(false);
  const [recordingFor, setRecordingFor] = useState<Invoice | null>(null);

  const companyDeals = state.deals.filter(
    (d) => d.companyId === companyId && !d.closedAt,
  );

  const { outstanding, paid, collected30d, collectedAll } = useMemo(() => {
    const unpaid = state.invoices.filter((i) => i.status !== "paid");
    const paidList = state.invoices.filter((i) => i.status === "paid");
    // Paid invoices without ledger rows (imports, older saves) still count.
    const ledgered = new Set(state.payments.map((p) => p.invoiceId));
    const legacy = paidList.filter((i) => !ledgered.has(i.id));
    const inWindow = (at: number) => at > now - 30 * DAY;
    return {
      outstanding: unpaid.reduce(
        (s, i) => s + invoiceBalance(i, state.payments),
        0,
      ),
      paid: paidList,
      collected30d:
        state.payments
          .filter((p) => inWindow(p.paidOn))
          .reduce((s, p) => s + p.amount, 0) +
        legacy
          .filter((i) => inWindow(i.paidAt ?? 0))
          .reduce((s, i) => s + i.amount, 0),
      collectedAll:
        state.payments.reduce((s, p) => s + p.amount, 0) +
        legacy.reduce((s, i) => s + i.amount, 0),
    };
  }, [state.invoices, state.payments, now]);

  const dueInvoices = state.invoices
    .filter((i) => i.status !== "paid")
    .sort((a, b) => a.dueAt - b.dueAt);
  const paidInvoices = paid.sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));

  const mrr = state.retainers
    .filter((r) => r.active)
    .reduce((s, r) => s + r.amount, 0);
  const retainers = [...state.retainers].sort(
    (a, b) => Number(b.active) - Number(a.active) || b.amount - a.amount,
  );
  const recentTime = state.timeEntries.slice(0, 10);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!companyId || !label.trim() || !Number.isFinite(value) || value <= 0)
      return;
    actions.addInvoice({
      companyId,
      label: label.trim(),
      amount: value,
      dueInDays: Number(dueDays) || 14,
      dealId: dealId || null,
    });
    setCreating(false);
    setLabel("");
    setAmount("");
    setDealId("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <PageHeader
        title="Billing & invoices"
        subtitle="Invoices flow from deals and contracts; record payments as they land and the client's portal history updates instantly."
      >
        <PrimaryButton onClick={() => { setCompanyId(clients[0]?.id ?? ""); setCreating(true); }}>
          <Plus className="size-4" />
          New invoice
        </PrimaryButton>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xl font-semibold tabular-nums text-accent">
            {fmtMoney(mrr)}
          </p>
          <p className="mt-1 text-xs text-ink-dim">retainer MRR</p>
        </Card>
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
            {fmtMoney(collectedAll)}
          </p>
          <p className="mt-1 text-xs text-ink-dim">collected · all time</p>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Retainers</SectionLabel>
          <GhostButton onClick={() => setRetainerModal({ open: true, editing: null })}>
            <Plus className="size-3.5" />
            New retainer
          </GhostButton>
        </div>
        <Card className="mt-3 divide-y divide-edge">
          {retainers.map((r) => (
            <RetainerRow
              key={r.id}
              retainer={r}
              now={now}
              onEdit={() => setRetainerModal({ open: true, editing: r })}
            />
          ))}
          {retainers.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">
              No retainers yet — recurring work (SEO, maintenance, WaaS) bills
              itself from here every month.
            </p>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Outstanding</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {dueInvoices.map((i) => (
            <InvoiceRow
              key={i.id}
              invoice={i}
              now={now}
              onRecord={() => setRecordingFor(i)}
            />
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
            <InvoiceRow
              key={i.id}
              invoice={i}
              now={now}
              onRecord={() => setRecordingFor(i)}
            />
          ))}
          {paidInvoices.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">No payments yet.</p>
          )}
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Time log</SectionLabel>
          <GhostButton onClick={() => setLoggingTime(true)}>
            <Timer className="size-3.5" />
            Log time
          </GhostButton>
        </div>
        <Card className="mt-3 divide-y divide-edge">
          {recentTime.map((t) => {
            const company = t.companyId
              ? companyById.get(t.companyId)
              : undefined;
            const retainer = t.retainerId
              ? state.retainers.find((r) => r.id === t.retainerId)
              : undefined;
            return (
              <div key={t.id} className="flex items-center gap-3.5 p-4">
                <Timer className="size-4 shrink-0 text-ink-faint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{fmtMinutes(t.minutes)}</span>
                    {t.note && (
                      <span className="ml-2 text-ink-dim">{t.note}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-faint">
                    {t.author} · {fmtDate(t.entryDate)}
                    {company ? ` · ${company.name}` : ""}
                    {retainer ? ` · ${retainer.name}` : ""}
                    {t.billable ? "" : " · non-billable"}
                  </p>
                </div>
                <GhostButton
                  onClick={() => actions.deleteTimeEntry(t.id)}
                  title="Delete entry"
                >
                  <Trash2 className="size-3.5" />
                </GhostButton>
              </div>
            );
          })}
          {recentTime.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">
              Nothing logged yet — track hours here or from any task, and
              retainer usage fills in automatically.
            </p>
          )}
        </Card>
      </div>

      {retainerModal.open && (
        <RetainerModal
          open
          onClose={() => setRetainerModal({ open: false })}
          editing={retainerModal.editing}
        />
      )}
      {loggingTime && <TimeLogModal onClose={() => setLoggingTime(false)} />}
      {recordingFor && (
        <RecordPaymentModal
          invoice={recordingFor}
          onClose={() => setRecordingFor(null)}
        />
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New invoice">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Client">
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setDealId("");
              }}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (USD)">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1500"
                inputMode="numeric"
                className={inputCls}
              />
            </Field>
            <Field label="Due">
              <select
                value={dueDays}
                onChange={(e) => setDueDays(e.target.value)}
                className={inputCls}
              >
                <option value="7">In 7 days</option>
                <option value="14">In 14 days</option>
                <option value="30">In 30 days</option>
              </select>
            </Field>
          </div>
          {companyDeals.length > 0 && (
            <Field label="Linked deal (optional)">
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className={inputCls}
              >
                <option value="">None</option>
                {companyDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <PrimaryButton type="submit" className="w-full justify-center">
            Issue invoice — due in {dueDays} days
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
