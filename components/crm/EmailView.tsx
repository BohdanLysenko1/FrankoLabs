"use client";

import { useState } from "react";
import { MailPlus, Megaphone, Workflow, Zap } from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { Card, PageHeader, SectionLabel } from "./ui";

/**
 * Email automation — sequences and broadcasts with demo stats. Sequences are
 * local fixtures; the "CRM automations" section reads the real rules engine
 * so the two systems tell one story.
 */

type Sequence = {
  id: string;
  name: string;
  trigger: string;
  steps: string[];
  stats: { sent: number; openRate: string; replies: number };
};

const SEQUENCES: Sequence[] = [
  {
    id: "seq-welcome",
    name: "New client welcome",
    trigger: "Fires when a deal is won",
    steps: [
      "Day 0 — Welcome + portal invite",
      "Day 2 — Meet your team & what happens next",
      "Day 7 — How to request changes (guide link)",
    ],
    stats: { sent: 14, openRate: "92%", replies: 6 },
  },
  {
    id: "seq-proposal",
    name: "Proposal follow-up",
    trigger: "Fires 3 days after a proposal goes quiet",
    steps: [
      "Day 3 — Any questions on the proposal?",
      "Day 7 — Case study relevant to their industry",
      "Day 14 — Last check-in, then close the loop",
    ],
    stats: { sent: 31, openRate: "78%", replies: 11 },
  },
  {
    id: "seq-winback",
    name: "Cold lead win-back",
    trigger: "Fires when a deal sits untouched for 30 days",
    steps: [
      "Day 0 — 'Still on your radar?' one-liner",
      "Day 10 — What's new since we last talked",
    ],
    stats: { sent: 9, openRate: "64%", replies: 2 },
  },
];

const BROADCASTS = [
  {
    id: "br-1",
    name: "Q3 client newsletter",
    audience: "All clients",
    sentDaysAgo: 12,
    stats: "88% opened · 3 replies",
  },
  {
    id: "br-2",
    name: "New: client portal launch",
    audience: "All clients",
    sentDaysAgo: 41,
    stats: "95% opened · 7 replies",
  },
];

export default function EmailView() {
  const { state } = useCrm();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "seq-welcome": true,
    "seq-proposal": true,
    "seq-winback": false,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <PageHeader
        title="Email automation"
        subtitle="Sequences triggered by real CRM events — deals won, proposals going quiet, leads going cold. Demo engine until sending connects."
      />

      <div>
        <SectionLabel>Sequences</SectionLabel>
        <div className="mt-3 space-y-3">
          {SEQUENCES.map((seq) => {
            const on = enabled[seq.id];
            return (
              <Card key={seq.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Workflow
                      className={`size-5 shrink-0 ${on ? "text-accent" : "text-ink-faint"}`}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{seq.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-ink-dim">
                        <Zap className="size-3" />
                        {seq.trigger}
                      </p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    onClick={() =>
                      setEnabled((e) => ({ ...e, [seq.id]: !e[seq.id] }))
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      on ? "bg-accent" : "bg-surface-3"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                        on ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {seq.steps.map((s) => (
                    <li key={s} className="flex items-center gap-2.5 text-sm text-ink-dim">
                      <span className="size-1.5 shrink-0 rounded-full bg-ink-faint" />
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-ink-faint">
                  {seq.stats.sent} sent · {seq.stats.openRate} opened ·{" "}
                  {seq.stats.replies} replies
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Broadcasts</SectionLabel>
        <Card className="mt-3 divide-y divide-edge">
          {BROADCASTS.map((b) => (
            <div key={b.id} className="flex items-center gap-3.5 p-4">
              <Megaphone className="size-4 shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.name}</p>
                <p className="text-xs text-ink-faint">
                  {b.audience} · sent {b.sentDaysAgo}d ago
                </p>
              </div>
              <p className="shrink-0 text-xs text-ink-dim">{b.stats}</p>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <SectionLabel>Wired to the CRM</SectionLabel>
        <Card className="mt-3 flex items-start gap-3.5 p-5">
          <MailPlus className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
          <p className="text-base leading-relaxed text-ink-dim">
            {state.rules.filter((r) => r.enabled).length} CRM automation
            {state.rules.filter((r) => r.enabled).length === 1 ? "" : "s"}{" "}
            (Settings → Automations) already fire on the same triggers these
            sequences use. When sending connects via Resend, every step above
            becomes a real email with revenue attribution through Analytics.
          </p>
        </Card>
      </div>
    </div>
  );
}
