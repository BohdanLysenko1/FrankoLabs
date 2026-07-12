"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Building2,
  CalendarCheck,
  CalendarPlus,
  CircleDollarSign,
  FileSearch,
  FileText,
  Hexagon,
  History,
  LayoutGrid,
  ListChecks,
  ListPlus,
  LockKeyhole,
  PanelsTopLeft,
  Plus,
  Search,
  Sparkles,
  SunMoon,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { apps } from "@/lib/apps";
import { crmNav } from "@/lib/crm/nav";
import { useCrm } from "@/lib/crm/store";
import {
  fmtMoney,
  relTime,
  stashOpenRequest,
  type Company,
  type OpenRequest,
} from "@/lib/crm/types";
import { productModules, statusStyle } from "@/lib/products";
import { toolsFor } from "@/lib/portal/portal";
import { useSession } from "@/lib/supabase/session";
import { getTheme, nextTheme, setTheme, useTheme } from "@/lib/theme";
import { resetWindowLayouts } from "@/lib/windows";
import { playSound } from "@/lib/sound";

/**
 * The one system-wide command palette — mounted by the public desktop, the
 * client portal (both via <Desktop>) and the CRM shell. Cmd/Ctrl+K anywhere.
 */

type PaletteScope = "site" | "crm";

type PaletteProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  scope?: PaletteScope;
  /** Signed-in portal client, when the site palette is shown to one. */
  company?: Company | null;
};

type Entry = {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  keywords?: string[];
  perform: () => void;
};

type Group = { heading: string; entries: Entry[] };

const RECENTS_KEY = "franko-os-recents-v1";
const RECENTS_MAX = 8;

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function pushRecent(id: string) {
  try {
    const next = [id, ...loadRecents().filter((r) => r !== id)].slice(
      0,
      RECENTS_MAX,
    );
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — recents just don't persist.
  }
}

const itemCls =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-dim data-[selected=true]:bg-accent-dim data-[selected=true]:text-ink";

const groupCls =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink-dim";

export default function CommandPalette({
  open,
  setOpen,
  scope = "site",
  company = null,
}: PaletteProps) {
  const router = useRouter();
  const { state, actions } = useCrm();
  const session = useSession();
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const prevFocus = useRef<HTMLElement | null>(null);

  const recents = useMemo(() => (open ? loadRecents() : []), [open]);

  useEffect(() => {
    if (!open) return;
    prevFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    playSound("palette");
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    prevFocus.current?.focus();
    prevFocus.current = null;
  }, [setOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) close();
        else setOpen(true);
      }
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen, close]);

  // CRM data stays behind auth: the CRM shell only mounts this palette once
  // signed in, and the site palette checks the session itself. Signed-out
  // visitors browse the seeded demo store, which is public by design.
  const crmUnlocked =
    scope === "crm" || !session.user || Boolean(session.membership);
  const showCrmData = !company && crmUnlocked;

  const groups = useMemo<Group[]>(() => {
    const go = (href: string, newTab?: boolean) => () => {
      if (newTab) window.open(href, "_blank", "noopener");
      else router.push(href);
    };
    const openRecord = (href: string, request: OpenRequest) => () => {
      if (scope === "crm") actions.requestOpen(request);
      else stashOpenRequest(request);
      router.push(href);
    };

    const result: Group[] = [];
    const portalTools = company ? toolsFor(state, company) : [];

    const actionEntries: Entry[] = [];
    if (scope === "site" && !company) {
      actionEntries.push(
        {
          id: "act-consult",
          label: "Book a Consultation",
          icon: CalendarCheck,
          hint: "free intro call",
          keywords: ["call", "meeting", "talk"],
          perform: go("/contact"),
        },
        {
          id: "act-audit",
          label: "Request a Website Audit",
          icon: FileSearch,
          hint: "we review your current site",
          keywords: ["review", "site"],
          perform: go("/contact?type=audit"),
        },
        {
          id: "act-waitlist",
          label: "Join the Franko OS Waitlist",
          icon: Sparkles,
          hint: "early access",
          keywords: ["signup", "beta"],
          perform: go("/contact?type=waitlist"),
        },
      );
    }
    if (company) {
      if (portalTools.some((t) => t.id === "support")) {
        actionEntries.push({
          id: "act-support",
          label: "New Support Request",
          icon: ListPlus,
          hint: "straight to the team's queue",
          keywords: ["ticket", "help", "change"],
          perform: go("/portal/support"),
        });
      }
      actionEntries.push({
        id: "act-book-call",
        label: "Book a Call",
        icon: CalendarCheck,
        keywords: ["meeting", "talk"],
        perform: go("/contact"),
      });
    }
    const assistantHref =
      scope === "crm"
        ? "/crm/assistant"
        : company
          ? portalTools.some((t) => t.id === "assistant")
            ? "/portal/assistant"
            : null
          : crmUnlocked
            ? "/crm/assistant"
            : "/products/ai-assistant";
    if (assistantHref) {
      actionEntries.push({
        id: "act-assistant",
        label: "Open Assistant",
        icon: Sparkles,
        hint: "ask anything",
        keywords: ["ai", "chat", "help"],
        perform: go(assistantHref),
      });
    }
    actionEntries.push({
      id: "act-theme",
      label: "Switch Theme",
      icon: SunMoon,
      hint: `${theme} → ${nextTheme(theme)}`,
      keywords: ["dark", "light", "retro", "xp", "appearance"],
      perform: () => setTheme(nextTheme(getTheme())),
    });
    if (scope === "site") {
      actionEntries.push({
        id: "act-reset-windows",
        label: "Reset Window Layout",
        icon: PanelsTopLeft,
        hint: "positions & sizes",
        keywords: ["windows", "snap", "arrange"],
        perform: () => resetWindowLayouts(),
      });
    }
    if (scope === "crm" && session.user) {
      actionEntries.push({
        id: "act-lock",
        label: "Lock Workspace",
        icon: LockKeyhole,
        hint: "sign out of the CRM",
        keywords: ["logout", "sign out", "secure"],
        perform: () => void session.signOut(),
      });
    }
    result.push({ heading: "Actions", entries: actionEntries });

    if (showCrmData) {
      result.push({
        heading: "Create",
        entries: [
          {
            id: "new-deal",
            label: "New Deal",
            icon: Plus,
            keywords: ["pipeline", "sale", "opportunity"],
            perform: openRecord("/crm/pipeline", { kind: "new-deal" }),
          },
          {
            id: "new-contact",
            label: "New Contact",
            icon: UserPlus,
            keywords: ["person", "lead"],
            perform: openRecord("/crm/contacts", { kind: "new-contact" }),
          },
          {
            id: "new-task",
            label: "New Task",
            icon: ListPlus,
            keywords: ["todo", "reminder"],
            perform: openRecord("/crm/tasks", { kind: "new-task" }),
          },
          {
            id: "new-event",
            label: "New Event",
            icon: CalendarPlus,
            keywords: ["calendar", "meeting", "call"],
            perform: openRecord("/crm/calendar", { kind: "new-event" }),
          },
          {
            id: "new-proposal",
            label: "New Proposal",
            icon: FileText,
            keywords: ["quote", "contract", "pricing", "builder"],
            perform: openRecord("/crm/contracts", { kind: "new-proposal" }),
          },
        ],
      });

      result.push({
        heading: "CRM",
        entries: crmNav.map((item) => ({
          id: `crm${item.href.replace(/\//g, "-")}`,
          label: item.label,
          icon: item.icon,
          hint: item.href,
          keywords: ["crm", "module"],
          perform: go(item.href),
        })),
      });
    }

    if (company) {
      result.push({
        heading: "Your tools",
        entries: [
          {
            id: "portal-dashboard",
            label: "Dashboard",
            icon: LayoutGrid,
            hint: "/",
            perform: go("/"),
          },
          ...portalTools.map((tool) => ({
            id: `portal-${tool.id}`,
            label: tool.name,
            icon: tool.icon,
            hint: tool.href,
            keywords: [tool.description],
            perform: go(tool.href),
          })),
        ],
      });
    } else {
      result.push({
        heading: scope === "crm" ? "Website" : "Go to",
        entries: apps
          .filter((app) => scope !== "crm" || app.id !== "crm")
          .map((app) => ({
            id: `app-${app.id}`,
            label: app.name,
            icon: app.icon,
            hint: app.href,
            keywords: [app.description],
            perform: go(app.href, scope === "site" ? app.newTab : false),
          })),
      });
    }

    if (showCrmData) {
      result.push({
        heading: "Deals",
        entries: state.deals.map((d) => ({
          id: `deal-${d.id}`,
          label: d.name,
          icon: CircleDollarSign,
          hint: fmtMoney(d.value),
          keywords: ["deal"],
          perform: openRecord("/crm/pipeline", { kind: "deal", id: d.id }),
        })),
      });
      result.push({
        heading: "Contacts",
        entries: state.contacts.map((c) => ({
          id: `contact-${c.id}`,
          label: c.name,
          icon: Users,
          hint: c.role,
          keywords: ["contact", c.email],
          perform: openRecord("/crm/contacts", { kind: "contact", id: c.id }),
        })),
      });
      result.push({
        heading: "Companies",
        entries: state.companies.map((c) => ({
          id: `company-${c.id}`,
          label: c.name,
          icon: Building2,
          hint: c.industry,
          keywords: ["company", c.domain],
          perform: openRecord("/crm/companies", { kind: "company", id: c.id }),
        })),
      });
      result.push({
        heading: "Tasks",
        entries: state.tasks
          .filter((t) => !t.done)
          .map((t) => ({
            id: `task-${t.id}`,
            label: t.title,
            icon: ListChecks,
            hint: relTime(t.dueAt),
            keywords: ["task", "todo"],
            perform: go("/crm/tasks"),
          })),
      });
      result.push({
        heading: "Docs",
        entries: state.docs.map((a) => ({
          id: `doc-${a.slug}`,
          label: a.title,
          icon: FileText,
          hint: a.category,
          keywords: ["doc", "article", a.summary],
          perform: openRecord("/crm/docs", { kind: "doc", id: a.slug }),
        })),
      });
    }

    if (company) {
      result.push({
        heading: "Guides",
        entries: state.docs
          .filter((a) => a.clientVisible)
          .map((a) => ({
            id: `guide-${a.slug}`,
            label: a.title,
            icon: FileText,
            hint: `${a.minutes} min read`,
            keywords: ["guide", "help", a.summary],
            perform: go("/portal/guides"),
          })),
      });
    } else {
      result.push({
        heading: "Products",
        entries: productModules.map((m) => ({
          id: `product-${m.slug}`,
          label: m.name,
          icon: Hexagon,
          hint: statusStyle[m.status].label,
          keywords: ["product", "module", m.tagline],
          perform: go(`/products/${m.slug}`),
        })),
      });
    }

    return result;
  }, [
    scope,
    company,
    state,
    actions,
    router,
    theme,
    session,
    crmUnlocked,
    showCrmData,
  ]);

  const entryById = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const group of groups)
      for (const entry of group.entries) map.set(entry.id, entry);
    return map;
  }, [groups]);

  const recentEntries = useMemo(
    () =>
      recents
        .map((id) => entryById.get(id))
        .filter((e): e is Entry => e !== undefined),
    [recents, entryById],
  );

  if (!open) return null;

  const run = (entry: Entry) => {
    pushRecent(entry.id);
    close();
    entry.perform();
  };

  const renderEntry = (entry: Entry) => (
    <Command.Item
      key={entry.id}
      value={`${entry.label} ${entry.id}`}
      keywords={entry.keywords}
      onSelect={() => run(entry)}
      className={itemCls}
    >
      <entry.icon className="size-4.5 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.hint && (
        <span className="ml-auto max-w-44 shrink-0 truncate text-xs text-ink-dim">
          {entry.hint}
        </span>
      )}
    </Command.Item>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-[16vh] backdrop-blur-sm"
      onClick={close}
      onKeyDown={(e) => {
        if (e.key === "Tab") e.preventDefault();
      }}
    >
      <Command
        label="Franko OS command palette"
        className="os-menu w-full max-w-xl overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-2xl shadow-black/70 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4">
          <Search className="size-5 text-ink-dim" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search Franko OS — records, pages, actions…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-edge px-1.5 py-0.5 font-mono text-[11px] text-ink-dim">
            esc
          </kbd>
        </div>
        <Command.List className="os-scroll max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center font-mono text-xs text-ink-dim">
            no results found
          </Command.Empty>

          {query === "" && recentEntries.length > 0 && (
            <Command.Group heading="Recent" className={groupCls}>
              {recentEntries.map((entry) => (
                <Command.Item
                  key={`recent-${entry.id}`}
                  value={`recent ${entry.label} ${entry.id}`}
                  onSelect={() => run(entry)}
                  className={itemCls}
                >
                  <History className="size-4.5 shrink-0" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  {entry.hint && (
                    <span className="ml-auto max-w-44 shrink-0 truncate text-xs text-ink-dim">
                      {entry.hint}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {groups.map(
            (group) =>
              group.entries.length > 0 && (
                <Command.Group
                  key={group.heading}
                  heading={group.heading}
                  className={groupCls}
                >
                  {group.entries.map((entry) => renderEntry(entry))}
                </Command.Group>
              ),
          )}
        </Command.List>
      </Command>
    </div>
  );
}
