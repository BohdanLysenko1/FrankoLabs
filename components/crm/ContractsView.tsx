"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, FilePen, Plus, Send } from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { fmtDate, fmtMoney, relTime, type Contract } from "@/lib/crm/types";
import ProposalBuilder from "./ProposalBuilder";
import {
  Card,
  Field,
  Modal,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

function ContractRow({ contract }: { contract: Contract }) {
  const { companyById } = useCrmLookups();
  const company = companyById.get(contract.companyId);

  return (
    <div className="flex items-center gap-3.5 p-4">
      <FilePen
        className={`size-4 shrink-0 ${
          contract.status === "signed" ? "text-ink-faint" : "text-accent"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{contract.title}</p>
        <p className="truncate text-xs text-ink-faint">
          {company?.name ?? "—"} · {fmtMoney(contract.amount)} · sent{" "}
          {fmtDate(contract.sentAt)}
        </p>
      </div>
      {contract.status === "signed" ? (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-accent">
          <CheckCircle2 className="size-3" />
          signed by {contract.signedBy}
          {contract.signedAt ? ` · ${fmtDate(contract.signedAt)}` : ""}
        </span>
      ) : contract.status === "viewed" ? (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-warn/40 px-2.5 py-1 text-[11px] font-medium text-warn">
          <Eye className="size-3" />
          viewed {contract.viewedAt ? relTime(contract.viewedAt) : ""}
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-ink-dim">
          <Send className="size-3" />
          sent · not opened yet
        </span>
      )}
    </div>
  );
}

export default function ContractsView() {
  const { state, actions } = useCrm();
  const companies = state.companies;

  const [localTab, setTab] = useState<"agreements" | "builder">("agreements");
  const [creating, setCreating] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [amount, setAmount] = useState("");

  // A palette "New proposal" request pins the builder tab until consumed.
  const tab =
    state.ui.openRequest?.kind === "new-proposal" ? "builder" : localTab;

  const pending = state.contracts
    .filter((c) => c.status !== "signed")
    .sort((a, b) => b.sentAt - a.sentAt);
  const signed = state.contracts
    .filter((c) => c.status === "signed")
    .sort((a, b) => (b.signedAt ?? 0) - (a.signedAt ?? 0));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!companyId || !title.trim() || !Number.isFinite(value) || value <= 0)
      return;
    actions.sendContract({
      companyId,
      title: title.trim(),
      summary:
        summary.trim() ||
        "Scope, timeline and terms as discussed — full details attached to the deal.",
      amount: value,
    });
    setCreating(false);
    setTitle("");
    setSummary("");
    setAmount("");
  };

  return (
    <div
      className={`mx-auto space-y-8 p-4 pb-16 md:p-8 ${
        tab === "builder" ? "max-w-7xl" : "max-w-4xl"
      }`}
    >
      <PageHeader
        title="Contracts"
        subtitle="From proposal to signature in one flow. Clients sign in their portal; a signature invoices the deposit and schedules kickoff automatically."
      >
        {tab === "agreements" && (
          <PrimaryButton
            onClick={() => {
              setCompanyId(companies[0]?.id ?? "");
              setCreating(true);
            }}
          >
            <Plus className="size-4" />
            Send contract
          </PrimaryButton>
        )}
      </PageHeader>

      <div className="flex items-center gap-2">
        {(
          [
            ["agreements", "Agreements"],
            ["builder", "Proposal builder"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              tab === id
                ? "border-accent/50 bg-accent-dim text-accent"
                : "border-edge bg-surface-2/60 text-ink-dim hover:border-edge-strong hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "builder" ? (
        <ProposalBuilder
          onRequestConsumed={() => setTab("builder")}
          onSent={() => setTab("agreements")}
        />
      ) : (
        <>
      <div>
        <SectionLabel>Out for signature</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {pending.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
          {pending.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">
              Nothing out for signature.
            </p>
          )}
        </Card>
      </div>

      <div>
        <SectionLabel>Signed</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {signed.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
          {signed.length === 0 && (
            <p className="p-5 text-sm text-ink-faint">No signed contracts yet.</p>
          )}
        </Card>
      </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Send contract">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Company">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputCls}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Agreement title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website redesign agreement"
              className={inputCls}
            />
          </Field>
          <Field label="Summary (what the client reads first)">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Scope, timeline, and what's included…"
              className={`${inputCls} os-scroll resize-none`}
            />
          </Field>
          <Field label="Contract value (USD)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="12000"
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <PrimaryButton type="submit" className="w-full justify-center">
            <Send className="size-4" />
            Send for signature
          </PrimaryButton>
          <p className="text-center text-[11px] leading-relaxed text-ink-faint">
            The client reviews and signs it in their portal. Signing invoices a
            50% deposit and creates the kickoff task.
          </p>
        </form>
      </Modal>
    </div>
  );
}
