"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  FilePen,
  Flame,
  Kanban,
  LifeBuoy,
  ListChecks,
  PackageOpen,
  Receipt,
  Zap,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { computePulse } from "@/lib/crm/pulse";
import { DAY, relTime } from "@/lib/crm/types";

type Notif = {
  id: string;
  icon: typeof Bell;
  tone: string;
  title: string;
  detail: string;
  href: string;
  at: number | null;
};

/**
 * The inbox is derived, not stored: Pulse signals, due tasks and recent
 * system events are computed fresh each render, and dismissals are tracked
 * as read ids in the store.
 */
function useNotifications(now: number): Notif[] {
  const { state } = useCrm();
  return useMemo(() => {
    const items: Notif[] = [];

    const { signals } = computePulse(state, now);
    for (const s of signals) {
      if (s.severity === "info") continue;
      items.push({
        id: s.id,
        icon: s.severity === "critical" ? Flame : AlertTriangle,
        tone: s.severity === "critical" ? "text-danger" : "text-warn",
        title: s.title,
        detail: s.detail,
        href: "/crm/pulse",
        at: null,
      });
    }

    for (const t of state.tasks) {
      if (t.done || t.dueAt >= now + DAY) continue;
      const overdue = t.dueAt < now;
      items.push({
        id: `task-${t.id}`,
        icon: ListChecks,
        tone: overdue ? "text-danger" : "text-warn",
        title: overdue ? "Overdue task" : "Task due today",
        detail: t.title,
        href: "/crm/tasks",
        at: t.dueAt,
      });
    }

    const companyName = (id: string | null) =>
      state.companies.find((c) => c.id === id)?.name ?? "a client";

    for (const t of state.tickets) {
      if (t.status === "resolved") continue;
      const last = t.messages[t.messages.length - 1];
      if (last?.from !== "client") continue;
      items.push({
        id: `tic-${t.id}-${t.messages.length}`,
        icon: LifeBuoy,
        tone: "text-warn",
        title:
          t.messages.length === 1 ? "New support ticket" : "Client replied",
        detail: `${companyName(t.companyId)}: ${t.subject}`,
        href: "/crm/support",
        at: last.at,
      });
    }

    for (const c of state.contracts) {
      if (c.status === "viewed" && c.viewedAt && now - c.viewedAt <= 3 * DAY) {
        items.push({
          id: `con-viewed-${c.id}`,
          icon: FilePen,
          tone: "text-warn",
          title: "Contract viewed, not signed",
          detail: `${companyName(c.companyId)} opened “${c.title}”`,
          href: "/crm/contracts",
          at: c.viewedAt,
        });
      } else if (
        c.status === "signed" &&
        c.signedAt &&
        now - c.signedAt <= 3 * DAY
      ) {
        items.push({
          id: `con-signed-${c.id}`,
          icon: FilePen,
          tone: "text-accent",
          title: "Contract signed",
          detail: `${c.signedBy} signed “${c.title}”`,
          href: "/crm/contracts",
          at: c.signedAt,
        });
      }
    }

    for (const i of state.invoices) {
      if (i.status === "paid" && i.paidAt && now - i.paidAt <= 3 * DAY) {
        items.push({
          id: `inv-paid-${i.id}`,
          icon: Receipt,
          tone: "text-accent",
          title: "Invoice paid",
          detail: `${i.number} · ${companyName(i.companyId)} — ${i.label}`,
          href: "/crm/billing",
          at: i.paidAt,
        });
      } else if (i.status === "due" && i.dueAt < now) {
        items.push({
          id: `inv-over-${i.id}`,
          icon: Receipt,
          tone: "text-danger",
          title: "Invoice overdue",
          detail: `${i.number} · ${companyName(i.companyId)} — ${i.label}`,
          href: "/crm/billing",
          at: i.dueAt,
        });
      }
    }

    for (const d of state.deliverables) {
      if (!d.respondedAt || now - d.respondedAt > 3 * DAY) continue;
      items.push({
        id: `del-${d.id}-${d.status}`,
        icon: PackageOpen,
        tone: d.status === "approved" ? "text-accent" : "text-warn",
        title:
          d.status === "approved"
            ? "Deliverable approved"
            : "Changes requested",
        detail: `${companyName(d.companyId)}: ${d.title}${d.clientComment ? ` — “${d.clientComment}”` : ""}`,
        href: "/crm/tasks",
        at: d.respondedAt,
      });
    }

    for (const a of state.activities) {
      if (now - a.at > 3 * DAY) continue;
      if (a.type === "system" && a.summary.startsWith("Automation ran")) {
        items.push({
          id: `act-${a.id}`,
          icon: Zap,
          tone: "text-accent",
          title: "Automation",
          detail: a.summary,
          href: "/crm/settings",
          at: a.at,
        });
      } else if (a.type === "stage") {
        items.push({
          id: `act-${a.id}`,
          icon: Kanban,
          tone: "text-ink-dim",
          title: "Deal moved",
          detail: a.summary,
          href: "/crm/pipeline",
          at: a.at,
        });
      }
    }

    // Pulse signals (no timestamp) stay pinned on top; the rest is newest-first.
    const pinned = items.filter((i) => i.at === null);
    const dated = items
      .filter((i) => i.at !== null)
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
    return [...pinned, ...dated].slice(0, 20);
  }, [state, now]);
}

export default function NotificationsBell() {
  const { state, actions } = useCrm();
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);

  const items = useNotifications(now);
  const read = new Set(state.readNotifIds);
  const unread = items.filter((i) => !read.has(i.id));

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
        aria-label={`Notifications — ${unread.length} unread`}
        className="relative rounded-lg p-2 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
      >
        <Bell className="size-4.5" strokeWidth={1.75} />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-semibold tabular-nums text-black">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="os-menu absolute right-0 top-full z-50 mt-2 w-88 max-w-[90vw] rounded-xl border border-edge bg-surface-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-edge px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            {unread.length > 0 && (
              <button
                onClick={() => actions.markNotifsRead(items.map((i) => i.id))}
                className="flex items-center gap-1.5 text-xs text-ink-dim transition hover:text-accent"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="os-scroll max-h-96 overflow-y-auto p-1.5">
            {items.map((n) => {
              const isRead = read.has(n.id);
              const Icon = n.icon;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    actions.markNotifsRead([n.id]);
                    setOpen(false);
                  }}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent-dim ${isRead ? "opacity-55" : ""}`}
                >
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${n.tone}`}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {n.at && (
                        <span className="text-[11px] text-ink-dim">
                          {relTime(n.at, now)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-dim">
                      {n.detail}
                    </span>
                  </span>
                  {!isRead && (
                    <span className="ml-auto mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-ink-dim">
                All caught up — nothing needs attention.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
