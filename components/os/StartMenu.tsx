"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Info,
  LogOut,
  Mail,
  Power,
  Tag,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import LogoMark from "./LogoMark";
import { apps } from "@/lib/apps";
import { useCrm } from "@/lib/crm/store";
import { usePortalAuth } from "@/lib/portal/auth";
import { toolsFor } from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";
import { setTheme } from "@/lib/theme";

type StartMenuProps = {
  onClose: () => void;
};

type Entry = { icon: LucideIcon; label: string; href: string; hint?: string };

const places: Entry[] = [
  { icon: BookOpen, label: "Documentation", href: "/resources" },
  { icon: Tag, label: "Pricing & Plans", href: "/pricing" },
  { icon: FolderOpen, label: "Our Work", href: "/projects" },
  { icon: Info, label: "About Franko Labs", href: "/about" },
  { icon: Mail, label: "Contact", href: "/contact" },
];

/** The XP-style Start menu — only rendered in the retro theme. */
export default function StartMenu({ onClose }: StartMenuProps) {
  const router = useRouter();
  const { state } = useCrm();
  const { company, signOut } = usePortalAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const go = (href: string, newTab?: boolean) => {
    playSound("tap");
    onClose();
    if (newTab) window.open(href, "_blank", "noopener");
    else router.push(href);
  };

  const programs: Entry[] = company
    ? toolsFor(state, company).map((t) => ({
        icon: t.icon,
        label: t.name,
        href: t.href,
        hint: t.description,
      }))
    : apps
        .filter((a) => a.href !== "/")
        .map((a) => ({
          icon: a.icon,
          label: a.name,
          href: a.href,
          hint: a.description,
        }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, scaleY: 0.92 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="xp-startmenu absolute bottom-full left-0 z-50 w-[26rem] max-w-[calc(100vw-1rem)] origin-bottom select-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header — user band */}
      <div className="xp-startmenu-head flex items-center gap-3 px-3 py-3">
        <span className="flex size-11 items-center justify-center rounded-md border-2 border-white/70 bg-white/20 shadow-inner">
          <LogoMark className="h-7 w-auto" />
        </span>
        <span className="text-lg font-bold">
          {company ? company.name : "Franko Labs"}
        </span>
      </div>
      <div className="xp-orange-rule" />

      {/* Body — two columns, white programs / tinted places */}
      <div className="grid grid-cols-[1.15fr_1fr] bg-white text-sm">
        <div className="flex flex-col gap-0.5 p-1.5">
          {programs.map((p) => (
            <button
              key={p.label}
              onClick={() => go(p.href)}
              className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-ink hover:bg-[var(--xp-highlight)] hover:text-white"
            >
              <p.icon className="size-6 shrink-0 text-accent" strokeWidth={1.5} />
              <span className="min-w-0">
                <span className="block truncate font-semibold leading-tight">
                  {p.label}
                </span>
                {p.hint && (
                  <span className="block truncate text-[11px] leading-tight opacity-60">
                    {p.hint}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-0.5 border-l border-[#c8cfa5] bg-[#eef1dd] p-1.5">
          {places.map((p) => (
            <button
              key={p.label}
              onClick={() => go(p.href)}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left font-semibold text-[#3c4423] hover:bg-[var(--xp-highlight)] hover:text-white"
            >
              <p.icon className="size-4.5 shrink-0" strokeWidth={1.75} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer — log off / leave retro mode */}
      <div className="xp-startmenu-foot flex items-center justify-end gap-2 px-3 py-2 text-xs font-semibold">
        {company && (
          <button
            onClick={() => {
              playSound("close");
              onClose();
              signOut();
            }}
            className="flex items-center gap-1.5 rounded-sm px-2 py-1 hover:bg-white/15"
          >
            <span className="flex size-5 items-center justify-center rounded-sm bg-[#d8a437] shadow-inner">
              <LogOut className="size-3" strokeWidth={2.5} />
            </span>
            Log Off
          </button>
        )}
        <button
          title="Back to the modern theme"
          onClick={() => {
            playSound("close");
            onClose();
            setTheme("dark");
          }}
          className="flex items-center gap-1.5 rounded-sm px-2 py-1 hover:bg-white/15"
        >
          <span className="flex size-5 items-center justify-center rounded-sm bg-[#c0391f] shadow-inner">
            <Power className="size-3" strokeWidth={2.5} />
          </span>
          Turn Off Retro Mode
        </button>
      </div>
    </motion.div>
  );
}
