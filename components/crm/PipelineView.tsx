"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trophy,
  X,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import { computeDealHealth, healthStyle } from "@/lib/crm/pulse";
import { fmtMoney, type Deal } from "@/lib/crm/types";
import DealDrawer from "./DealDrawer";
import {
  Avatar,
  Field,
  GhostButton,
  Modal,
  PageHeader,
  PrimaryButton,
  inputCls,
} from "./ui";

function DealCard({
  deal,
  onDragStart,
  onOpen,
}: {
  deal: Deal;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onOpen: (id: string) => void;
}) {
  const { state } = useCrm();
  const { companyById, contactById, stageById } = useCrmLookups();
  const company = deal.companyId ? companyById.get(deal.companyId) : null;
  const contact = deal.contactId ? contactById.get(deal.contactId) : null;
  const open = stageById.get(deal.stageId)?.kind === "open";
  const health = open ? computeDealHealth(state, deal) : null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onOpen(deal.id)}
      className="group cursor-grab rounded-xl border border-edge bg-surface-2/70 p-3.5 transition hover:border-edge-strong active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium leading-snug">{deal.name}</p>
        <GripVertical className="size-4 shrink-0 text-ink-faint opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs tabular-nums text-ink-dim">
          {fmtMoney(deal.value)}
        </span>
        {health && (
          <span
            title={`Health ${health.score} — ${healthStyle[health.status].label}`}
            className={`size-2 rounded-full ${healthStyle[health.status].dot}`}
          />
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-ink-faint">
        {contact ? (
          <>
            <Avatar name={contact.name} hue={contact.hue} size="sm" />
            <span className="truncate">{contact.name}</span>
          </>
        ) : company ? (
          <>
            <Building2 className="size-3.5" />
            <span className="truncate">{company.name}</span>
          </>
        ) : (
          <span className="italic">Unassigned</span>
        )}
      </div>
    </div>
  );
}

function NewDealModal({ onClose }: { onClose: () => void }) {
  const { state, actions } = useCrm();
  const openStages = state.stages.filter((s) => s.kind === "open");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [contactId, setContactId] = useState("");
  const [stageId, setStageId] = useState(openStages[0]?.id ?? "");
  const [source, setSource] = useState("Referral");

  const submit = () => {
    if (!name.trim()) return;
    const contact = state.contacts.find((c) => c.id === contactId);
    const deal = actions.addDeal({
      name: name.trim(),
      value: Math.max(0, Number(value) || 0),
      contactId: contactId || null,
      companyId: contact?.companyId ?? null,
      stageId,
      source,
    });
    actions.logActivity({
      type: "system",
      summary: `Deal created: ${deal.name}.`,
      dealId: deal.id,
      contactId: contactId || null,
      companyId: contact?.companyId ?? null,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="New deal">
      <div className="space-y-4">
        <Field label="Deal name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme — website rebuild"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Value (USD)">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="numeric"
              placeholder="12000"
              className={inputCls}
            />
          </Field>
          <Field label="Stage">
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className={inputCls}
            >
              {openStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Contact">
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={inputCls}
          >
            <option value="">No contact yet</option>
            {state.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={inputCls}
          >
            {["Referral", "Website", "Google search", "Instagram", "Cold outreach", "Waitlist"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={submit}>Create deal</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

export default function PipelineView() {
  const { state, actions } = useCrm();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [localAdding, setLocalAdding] = useState(false);
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState("");
  const [minValue, setMinValue] = useState(0);
  const [showClosed, setShowClosed] = useState(true);

  // Command palette requests land here via the store.
  const req = state.ui.openRequest;
  const adding = localAdding || req?.kind === "new-deal";
  const openId = localOpenId ?? (req?.kind === "deal" ? (req.id ?? null) : null);
  const clearRequest = () => {
    if (req) actions.requestOpen(null);
  };

  const sources = useMemo(
    () => [...new Set(state.deals.map((d) => d.source))].sort(),
    [state.deals],
  );

  const columns = useMemo(() => {
    return state.stages.map((stage) => {
      const deals = state.deals.filter(
        (d) =>
          d.stageId === stage.id &&
          (!sourceFilter || d.source === sourceFilter) &&
          d.value >= minValue,
      );
      return {
        stage,
        deals,
        value: deals.reduce((s, d) => s + d.value, 0),
      };
    });
  }, [state.stages, state.deals, sourceFilter, minValue]);

  const openValue = columns
    .filter((c) => c.stage.kind === "open")
    .reduce((s, c) => s + c.value, 0);

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/deal-id", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/deal-id");
    if (id) actions.moveDeal(id, stageId);
  };

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      <PageHeader
        title="Pipeline"
        subtitle={`${fmtMoney(openValue)} open across ${columns.filter((c) => c.stage.kind === "open").reduce((s, c) => s + c.deals.length, 0)} deals — drag cards between stages, click one to open it.`}
      >
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          aria-label="Filter by source"
          className="rounded-xl border border-edge bg-surface-2/60 px-3 py-2 text-sm text-ink-dim outline-none transition focus:border-accent/50"
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={String(minValue)}
          onChange={(e) => setMinValue(Number(e.target.value))}
          aria-label="Filter by minimum value"
          className="rounded-xl border border-edge bg-surface-2/60 px-3 py-2 text-sm text-ink-dim outline-none transition focus:border-accent/50"
        >
          <option value="0">Any value</option>
          <option value="5000">$5k+</option>
          <option value="10000">$10k+</option>
          <option value="20000">$20k+</option>
        </select>
        <button
          onClick={() => setShowClosed(!showClosed)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface-2/60 px-3 py-2 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
        >
          {showClosed ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          Won / Lost
        </button>
        <PrimaryButton onClick={() => setLocalAdding(true)}>
          <Plus className="size-4" />
          New deal
        </PrimaryButton>
      </PageHeader>

      <div className="os-scroll mt-6 flex min-h-0 flex-1 gap-3 overflow-x-auto pb-4">
        {columns
          .filter((c) => showClosed || c.stage.kind === "open")
          .map(({ stage, deals, value }) => (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(stage.id);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => onDrop(e, stage.id)}
            className={`flex w-64 shrink-0 flex-col rounded-2xl border p-2.5 transition ${
              dragOver === stage.id
                ? "border-accent/60 bg-accent-dim/40"
                : "border-edge bg-surface/50"
            } ${stage.kind !== "open" ? "w-56 opacity-90" : ""}`}
          >
            <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                {stage.kind === "won" && (
                  <Trophy className="size-3.5 text-accent" />
                )}
                {stage.kind === "lost" && (
                  <X className="size-3.5 text-ink-faint" />
                )}
                {stage.name}
                <span className="rounded-full bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ink-dim">
                  {deals.length}
                </span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-ink-faint">
                {fmtMoney(value)}
              </span>
            </div>
            <div className="os-scroll min-h-24 flex-1 space-y-2 overflow-y-auto">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onDragStart={onDragStart}
                  onOpen={setLocalOpenId}
                />
              ))}
              {deals.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-edge text-xs text-ink-faint">
                  Drop deals here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <NewDealModal
          onClose={() => {
            setLocalAdding(false);
            clearRequest();
          }}
        />
      )}
      {openId && (
        <DealDrawer
          dealId={openId}
          onClose={() => {
            setLocalOpenId(null);
            clearRequest();
          }}
        />
      )}
    </div>
  );
}
