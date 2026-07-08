"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MailPlus,
  Boxes,
  Search,
  Tag,
  Info,
  ArrowLeft,
  RotateCw,
  PanelsTopLeft,
  Printer,
  Expand,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { resetWindowLayouts } from "@/lib/windows";
import { playSound } from "@/lib/sound";

export type ContextMenuState = { x: number; y: number } | null;

type ContextMenuProps = {
  state: ContextMenuState;
  onClose: () => void;
  openPalette: () => void;
};

type Item = {
  icon: LucideIcon;
  label: string;
  href?: string;
  action?: () => void;
};

const osItems: Item[] = [
  { icon: MailPlus, label: "New request", href: "/contact" },
  { icon: Boxes, label: "Browse services", href: "/solutions" },
  { icon: Tag, label: "View pricing", href: "/pricing" },
  { icon: Search, label: "Search…" },
  {
    icon: PanelsTopLeft,
    label: "Reset window layout",
    action: () => resetWindowLayouts(),
  },
  { icon: Info, label: "About Franko Labs", href: "/about" },
];

const browserItems: Item[] = [
  { icon: ArrowLeft, label: "Back", action: () => history.back() },
  { icon: RotateCw, label: "Reload page", action: () => location.reload() },
  { icon: Printer, label: "Print…", action: () => window.print() },
  {
    icon: Expand,
    label: "Toggle full screen",
    action: () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    },
  },
  {
    icon: Link2,
    label: "Copy page link",
    action: () => void navigator.clipboard.writeText(location.href),
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-widest text-ink-faint">
      {children}
    </p>
  );
}

export default function ContextMenu({ state, onClose, openPalette }: ContextMenuProps) {
  const router = useRouter();

  useEffect(() => {
    if (!state) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [state, onClose]);

  const run = (item: Item) => {
    playSound("tap");
    onClose();
    if (item.action) item.action();
    else if (item.href) router.push(item.href);
    else openPalette();
  };

  const renderItems = (items: Item[]) =>
    items.map((item) => (
      <button
        key={item.label}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-dim transition-colors hover:bg-accent-dim hover:text-ink"
        onClick={() => run(item)}
      >
        <item.icon className="size-4" strokeWidth={1.75} />
        {item.label}
      </button>
    ));

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="os-menu fixed z-[80] min-w-56 rounded-xl border border-edge bg-surface-2/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
          style={{
            left: Math.min(state.x, typeof window !== "undefined" ? window.innerWidth - 240 : state.x),
            top: Math.min(state.y, typeof window !== "undefined" ? window.innerHeight - 420 : state.y),
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SectionLabel>Franko OS</SectionLabel>
          {renderItems(osItems)}
          <div className="mx-2 my-1.5 h-px bg-edge" />
          <SectionLabel>Browser</SectionLabel>
          {renderItems(browserItems)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
