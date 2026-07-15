"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useCrm } from "@/lib/crm/store";
import { Field, Modal, PrimaryButton, inputCls } from "./ui";

/**
 * Log-time modal, shared by Billing's Time section and the Tasks list.
 * Mounted fresh on every open (render it conditionally); prefills come from
 * wherever it was opened — a task row passes its links, and picking a
 * company narrows the retainer choices to that client.
 */
export default function TimeLogModal({
  onClose,
  prefill,
}: {
  onClose: () => void;
  prefill?: {
    companyId?: string | null;
    retainerId?: string | null;
    taskId?: string | null;
    dealId?: string | null;
    note?: string;
  };
}) {
  const { state, actions } = useCrm();
  const [companyId, setCompanyId] = useState(() => {
    const retainer = prefill?.retainerId
      ? state.retainers.find((r) => r.id === prefill.retainerId)
      : undefined;
    const companyFromDeal = prefill?.dealId
      ? state.deals.find((d) => d.id === prefill.dealId)?.companyId
      : undefined;
    return prefill?.companyId ?? retainer?.companyId ?? companyFromDeal ?? "";
  });
  const [retainerId, setRetainerId] = useState(
    () =>
      prefill?.retainerId ??
      state.retainers.find((r) => r.companyId === companyId && r.active)?.id ??
      "",
  );
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [note, setNote] = useState(prefill?.note ?? "");
  const [billable, setBillable] = useState(true);

  const companyRetainers = useMemo(
    () => state.retainers.filter((r) => !companyId || r.companyId === companyId),
    [state.retainers, companyId],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const total = Math.round(Number(hours || 0) * 60 + Number(minutes || 0));
    if (!Number.isFinite(total) || total <= 0) return;
    const retainer = state.retainers.find((r) => r.id === retainerId);
    actions.logTime({
      companyId: companyId || retainer?.companyId || null,
      retainerId: retainerId || null,
      taskId: prefill?.taskId ?? null,
      dealId: prefill?.dealId ?? null,
      minutes: total,
      note,
      billable,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Log time">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours">
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="Minutes">
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="What was the work?">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Content refresh on the services page"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client">
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                const next = state.retainers.find(
                  (r) => r.companyId === e.target.value && r.active,
                );
                setRetainerId(next?.id ?? "");
              }}
              className={inputCls}
            >
              <option value="">None / internal</option>
              {state.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Retainer">
            <select
              value={retainerId}
              onChange={(e) => setRetainerId(e.target.value)}
              className={inputCls}
            >
              <option value="">None</option>
              {companyRetainers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-ink-dim">
          <input
            type="checkbox"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="size-4 accent-[#34d399]"
          />
          Billable
        </label>
        <PrimaryButton type="submit" className="w-full justify-center">
          Log time
        </PrimaryButton>
      </form>
    </Modal>
  );
}
