"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  Building2,
  CalendarDays,
  CalendarPlus,
  ChartColumn,
  CircleDollarSign,
  Eye,
  Kanban,
  LayoutDashboard,
  ListChecks,
  ListPlus,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { fmtMoney, type OpenRequest } from "@/lib/crm/types";

const pages = [
  { label: "Dashboard", href: "/crm", icon: LayoutDashboard },
  { label: "Pulse", href: "/crm/pulse", icon: Activity },
  { label: "Pipeline", href: "/crm/pipeline", icon: Kanban },
  { label: "Calendar", href: "/crm/calendar", icon: CalendarDays },
  { label: "Contacts", href: "/crm/contacts", icon: Users },
  { label: "Companies", href: "/crm/companies", icon: Building2 },
  { label: "Tasks", href: "/crm/tasks", icon: ListChecks },
  { label: "Reports", href: "/crm/reports", icon: ChartColumn },
  { label: "View as client", href: "/crm/portal", icon: Eye },
  { label: "Settings", href: "/crm/settings", icon: Settings },
];

const itemCls =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-dim data-[selected=true]:bg-accent-dim data-[selected=true]:text-ink";

const groupCls =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink-faint";

export default function CrmCommand() {
  const router = useRouter();
  const { state, actions } = useCrm();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string, request?: OpenRequest) => {
    setOpen(false);
    if (request) actions.requestOpen(request);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-[16vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        label="CRM command palette"
        className="os-menu w-full max-w-xl overflow-hidden rounded-xl border border-edge bg-surface-2/95 shadow-2xl shadow-black/70 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4">
          <Search className="size-5 text-ink-faint" />
          <Command.Input
            autoFocus
            placeholder="Search deals, contacts, companies — or run an action…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
            esc
          </kbd>
        </div>
        <Command.List className="os-scroll max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center font-mono text-xs text-ink-faint">
            no results
          </Command.Empty>

          <Command.Group heading="Create" className={groupCls}>
            <Command.Item
              onSelect={() => go("/crm/pipeline", { kind: "new-deal" })}
              className={itemCls}
            >
              <Plus className="size-4.5" strokeWidth={1.75} />
              New deal
            </Command.Item>
            <Command.Item
              onSelect={() => go("/crm/contacts", { kind: "new-contact" })}
              className={itemCls}
            >
              <UserPlus className="size-4.5" strokeWidth={1.75} />
              New contact
            </Command.Item>
            <Command.Item
              onSelect={() => go("/crm/tasks", { kind: "new-task" })}
              className={itemCls}
            >
              <ListPlus className="size-4.5" strokeWidth={1.75} />
              New task
            </Command.Item>
            <Command.Item
              onSelect={() => go("/crm/calendar", { kind: "new-event" })}
              className={itemCls}
            >
              <CalendarPlus className="size-4.5" strokeWidth={1.75} />
              New event
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Go to" className={groupCls}>
            {pages.map((p) => (
              <Command.Item
                key={p.href}
                onSelect={() => go(p.href)}
                className={itemCls}
              >
                <p.icon className="size-4.5" strokeWidth={1.75} />
                {p.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Deals" className={groupCls}>
            {state.deals.map((d) => (
              <Command.Item
                key={d.id}
                value={`deal ${d.name}`}
                onSelect={() =>
                  go("/crm/pipeline", { kind: "deal", id: d.id })
                }
                className={itemCls}
              >
                <CircleDollarSign className="size-4.5" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="font-mono text-xs tabular-nums text-ink-faint">
                  {fmtMoney(d.value)}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Contacts" className={groupCls}>
            {state.contacts.map((c) => (
              <Command.Item
                key={c.id}
                value={`contact ${c.name} ${c.email}`}
                onSelect={() =>
                  go("/crm/contacts", { kind: "contact", id: c.id })
                }
                className={itemCls}
              >
                <Users className="size-4.5" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="truncate text-xs text-ink-faint">
                  {c.role}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Companies" className={groupCls}>
            {state.companies.map((c) => (
              <Command.Item
                key={c.id}
                value={`company ${c.name}`}
                onSelect={() =>
                  go("/crm/companies", { kind: "company", id: c.id })
                }
                className={itemCls}
              >
                <Building2 className="size-4.5" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="text-xs text-ink-faint">{c.industry}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
