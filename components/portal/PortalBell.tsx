"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  FilePen,
  FileText,
  LifeBuoy,
  PackageOpen,
  Receipt,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { fmtMoney, invoiceBalance, relTime, type Company } from "@/lib/crm/types";
import {
  contractsFor,
  deliverablesFor,
  invoicesFor,
  ticketsFor,
  updatesFor,
} from "@/lib/portal/portal";

type PortalNotif = {
  id: string;
  icon: typeof Bell;
  title: string;
  detail: string;
  href: string;
  at: number;
};

const SEEN_KEY = "franko-portal-seen";

function readSeenAt(companyId: string): number {
  try {
    const raw = localStorage.getItem(`${SEEN_KEY}:${companyId}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * The client's "what's new" — derived from the same store the agency writes:
 * updates, contracts awaiting signature, due invoices, deliverables to
 * review, ticket replies. Read-state is a per-company timestamp.
 */
export default function PortalBell({ company }: { company: Company }) {
  const { state } = useCrm();
  const [open, setOpen] = useState(false);
  // Only mounts client-side (auth gates rendering) and remounts per company
  // via `key`, so the lazy read is safe and needs no syncing effect.
  const [seenAt, setSeenAt] = useState(() => readSeenAt(company.id));
  const [now] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const list: PortalNotif[] = [];

    for (const c of contractsFor(state, company.id)) {
      if (c.status === "signed") continue;
      list.push({
        id: `con-${c.id}`,
        icon: FilePen,
        title: "Awaiting your signature",
        detail: `${c.title} · ${fmtMoney(c.amount)}`,
        href: "/portal/contracts",
        at: c.sentAt,
      });
    }
    for (const i of invoicesFor(state, company.id)) {
      if (i.status === "paid") continue;
      list.push({
        id: `inv-${i.id}`,
        icon: Receipt,
        title: "Invoice due",
        detail: `${i.number} · ${fmtMoney(invoiceBalance(i, state.payments))} open — details in Billing`,
        href: "/portal/billing",
        at: i.issuedAt,
      });
    }
    for (const d of deliverablesFor(state, company.id)) {
      if (d.status !== "in_review") continue;
      list.push({
        id: `del-${d.id}`,
        icon: PackageOpen,
        title: "Ready for your review",
        detail: d.title,
        href: "/portal/projects",
        at: d.postedAt,
      });
    }
    for (const t of ticketsFor(state, company.id)) {
      const last = t.messages[t.messages.length - 1];
      if (t.status === "resolved" || last?.from !== "agency") continue;
      list.push({
        id: `tic-${t.id}`,
        icon: LifeBuoy,
        title: "The team replied",
        detail: t.subject,
        href: "/portal/support",
        at: last.at,
      });
    }
    for (const u of updatesFor(state, company.id).slice(0, 6)) {
      list.push({
        id: `upd-${u.id}`,
        icon: FileText,
        title: "Update from the team",
        detail: u.summary,
        href: "/portal/projects",
        at: u.at,
      });
    }

    return list.sort((a, b) => b.at - a.at).slice(0, 15);
  }, [state, company.id]);

  const unread = items.filter((i) => i.at > seenAt);

  const markAllSeen = () => {
    setSeenAt(now);
    try {
      localStorage.setItem(`${SEEN_KEY}:${company.id}`, String(now));
    } catch {
      // Storage unavailable — read-state lives in memory this visit.
    }
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`What's new — ${unread.length} unread`}
        className="relative rounded-md p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
      >
        <Bell className="size-4" strokeWidth={1.75} />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent font-mono text-[9px] font-semibold tabular-nums text-black">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="os-menu absolute right-0 top-full z-50 mt-2 w-88 max-w-[90vw] rounded-xl border border-edge bg-surface-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-edge px-4 py-3">
            <p className="text-sm font-medium">What&apos;s new</p>
            {unread.length > 0 && (
              <button
                onClick={markAllSeen}
                className="flex items-center gap-1.5 text-xs text-ink-dim transition hover:text-accent"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="os-scroll max-h-96 overflow-y-auto p-1.5">
            {items.map((n) => {
              const Icon = n.icon;
              const isNew = n.at > seenAt;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent-dim ${
                    isNew ? "" : "opacity-55"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${isNew ? "text-accent" : "text-ink-dim"}`}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      <span className="text-[11px] text-ink-dim">
                        {relTime(n.at, now)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-dim">
                      {n.detail}
                    </span>
                  </span>
                  {isNew && (
                    <span className="ml-auto mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-ink-dim">
                All caught up.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
