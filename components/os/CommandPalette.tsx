"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CalendarCheck,
  FileSearch,
  FolderOpen,
  BookOpen,
  Sparkles,
  Search,
  Tag,
} from "lucide-react";
import { apps } from "@/lib/apps";
import { playSound } from "@/lib/sound";

type PaletteProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const actions = [
  {
    label: "Book a Consultation",
    href: "/contact",
    icon: CalendarCheck,
    hint: "free intro call",
  },
  {
    label: "Request a Website Audit",
    href: "/contact?type=audit",
    icon: FileSearch,
    hint: "we review your current site",
  },
  {
    label: "View Pricing & Plans",
    href: "/pricing",
    icon: Tag,
    hint: "monthly plans",
  },
  {
    label: "View Portfolio",
    href: "/projects",
    icon: FolderOpen,
    hint: "shipped work",
  },
  {
    label: "Join the Franko OS Waitlist",
    href: "/contact?type=waitlist",
    icon: Sparkles,
    hint: "early access",
  },
  {
    label: "Read the Documentation",
    href: "/resources/docs",
    icon: BookOpen,
    hint: "Franko OS docs",
  },
];

export default function CommandPalette({ open, setOpen }: PaletteProps) {
  const router = useRouter();

  useEffect(() => {
    if (open) playSound("palette");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-[18vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-edge bg-surface-2/95 shadow-2xl shadow-black/70 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-edge px-4">
          <Search className="size-5 text-ink-faint" />
          <Command.Input
            autoFocus
            placeholder="Search Franko OS…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
            esc
          </kbd>
        </div>
        <Command.List className="os-scroll max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-8 text-center font-mono text-xs text-ink-faint">
            no results found
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink-faint"
          >
            {actions.map((a) => (
              <Command.Item
                key={a.label}
                onSelect={() => go(a.href)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-ink-dim data-[selected=true]:bg-accent-dim data-[selected=true]:text-ink"
              >
                <a.icon className="size-5" strokeWidth={1.75} />
                {a.label}
                <span className="ml-auto text-xs text-ink-faint">
                  {a.hint}
                </span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="Go to"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-ink-faint"
          >
            {apps.map((app) => (
              <Command.Item
                key={app.id}
                onSelect={() => go(app.href)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-[15px] text-ink-dim data-[selected=true]:bg-accent-dim data-[selected=true]:text-ink"
              >
                <app.icon className="size-5" strokeWidth={1.75} />
                {app.name}
                <span className="ml-auto text-xs text-ink-faint">
                  {app.href}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
