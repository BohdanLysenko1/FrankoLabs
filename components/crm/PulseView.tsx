"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCheck,
  Flame,
  Info,
  PhoneCall,
} from "lucide-react";
import { useCrm, useCrmLookups } from "@/lib/crm/store";
import {
  computePulse,
  healthStyle,
  overallPulse,
  type Signal,
} from "@/lib/crm/pulse";
import { DAY, fmtMoney } from "@/lib/crm/types";
import { Card, PageHeader, SectionLabel } from "./ui";

function SignalRow({ signal }: { signal: Signal }) {
  const { actions } = useCrm();
  const { dealById, contactById } = useCrmLookups();
  const [handled, setHandled] = useState(false);
  const deal = dealById.get(signal.dealId);

  const act = () => {
    if (!deal || handled) return;
    if (signal.action === "log-touch") {
      actions.logActivity({
        type: "call",
        summary: `Check-in call logged from Pulse — keeping ${deal.name} warm.`,
        dealId: deal.id,
        contactId: deal.contactId,
        companyId: deal.companyId,
      });
    } else if (signal.action === "create-task") {
      const contact = deal.contactId ? contactById.get(deal.contactId) : null;
      actions.addTask(
        `Follow up${contact ? ` with ${contact.name.split(" ")[0]}` : ""} — ${deal.name}`,
        Date.now() + DAY,
        { dealId: deal.id, contactId: deal.contactId },
      );
    }
    setHandled(true);
  };

  const Icon =
    signal.severity === "critical"
      ? Flame
      : signal.severity === "warning"
        ? AlertTriangle
        : Info;
  const tone =
    signal.severity === "critical"
      ? "text-danger"
      : signal.severity === "warning"
        ? "text-warn"
        : "text-accent";

  return (
    <div
      className={`flex items-start gap-3.5 rounded-xl border border-edge bg-surface-2/50 p-4 transition ${handled ? "opacity-50" : ""}`}
    >
      <span
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-edge bg-surface-2 ${tone}`}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{signal.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">
          {signal.detail}
        </p>
      </div>
      {signal.action !== "open-deal" && (
        <button
          onClick={act}
          disabled={handled}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            handled
              ? "border border-edge text-ink-faint"
              : "bg-accent text-black hover:brightness-110"
          }`}
        >
          {handled ? (
            <span className="flex items-center gap-1.5">
              <CheckCheck className="size-3.5" /> Done
            </span>
          ) : (
            signal.actionLabel
          )}
        </button>
      )}
    </div>
  );
}

export default function PulseView() {
  const { state } = useCrm();
  const { dealById, contactById } = useCrmLookups();
  const [now] = useState(() => Date.now());
  const pulse = useMemo(() => computePulse(state, now), [state, now]);
  const score = overallPulse(pulse.health);

  const counts = {
    healthy: pulse.health.filter((h) => h.status === "healthy").length,
    cooling: pulse.health.filter((h) => h.status === "cooling").length,
    atRisk: pulse.health.filter((h) => h.status === "at-risk").length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Pulse"
        subtitle="A system monitor for your relationships. Pulse scores every open deal from touch recency, stage age and overdue follow-ups — then tells you exactly what to fix."
      />

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="flex items-center gap-4 p-5">
          <Activity
            className={`size-8 ${score >= 72 ? "text-accent" : score >= 45 ? "text-warn" : "text-danger"}`}
            strokeWidth={1.5}
          />
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {score}
            </p>
            <p className="text-xs text-ink-faint">Pipeline pulse</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-2xl font-semibold tabular-nums text-accent">
            {counts.healthy}
          </p>
          <p className="mt-1 text-xs text-ink-faint">Healthy</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-2xl font-semibold tabular-nums text-warn">
            {counts.cooling}
          </p>
          <p className="mt-1 text-xs text-ink-faint">Cooling</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-2xl font-semibold tabular-nums text-danger">
            {counts.atRisk}
          </p>
          <p className="mt-1 text-xs text-ink-faint">At risk</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Signal feed */}
        <div>
          <SectionLabel>Signals — do these next</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {pulse.signals.map((s) => (
              <SignalRow key={s.id} signal={s} />
            ))}
            {pulse.signals.length === 0 && (
              <Card className="flex items-center gap-3 p-5 text-sm text-ink-dim">
                <PhoneCall className="size-5 text-accent" />
                Nothing needs attention. Every open deal is on cadence.
              </Card>
            )}
          </div>
        </div>

        {/* Deal health process list */}
        <div>
          <SectionLabel>Deal health</SectionLabel>
          <Card className="mt-3 divide-y divide-edge">
            {pulse.health.map((h) => {
              const deal = dealById.get(h.dealId);
              if (!deal) return null;
              const contact = deal.contactId
                ? contactById.get(deal.contactId)
                : null;
              const style = healthStyle[h.status];
              return (
                <div key={h.dealId} className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {deal.name}
                    </p>
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${style.text}`}
                    >
                      {h.score}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{ width: `${h.score}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums text-ink-faint">
                    <span>{fmtMoney(deal.value)}</span>
                    <span>
                      last touch {h.daysSinceTouch}d (cadence {h.cadence}d)
                    </span>
                    <span>{h.daysInStage}d in stage</span>
                    {h.overdueTasks > 0 && (
                      <span className="text-danger">
                        {h.overdueTasks} overdue
                      </span>
                    )}
                    {contact && <span>{contact.name}</span>}
                  </div>
                </div>
              );
            })}
            {pulse.health.length === 0 && (
              <p className="p-6 text-center text-sm text-ink-faint">
                Open deals will appear here with live health scores.
              </p>
            )}
          </Card>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-ink-faint">
        How scoring works: each stage has an expected touch cadence (a new lead
        expects contact within a day; a proposal every four). Silence past the
        cadence, stalling in one stage, and overdue tasks all drain a
        deal&apos;s score. Log a call, email or meeting to restart the clock.
      </p>
    </div>
  );
}
