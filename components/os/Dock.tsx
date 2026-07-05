"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { apps, type OSApp } from "@/lib/apps";
import { usePortalAuth } from "@/lib/portal/auth";
import { toolsFor } from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Dock() {
  const pathname = usePathname();
  const { company } = usePortalAuth();

  // Signed-in clients see their desktop's tools, not the marketing apps.
  const items: OSApp[] = company
    ? [
        {
          id: "portal-dashboard",
          name: "Dashboard",
          href: "/",
          icon: LayoutGrid,
          description: "Your workspace at a glance",
        },
        ...toolsFor(company).map((t) => ({
          id: `portal-${t.id}`,
          name: t.name,
          href: t.href,
          icon: t.icon,
          description: t.description,
        })),
      ]
    : apps;

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-3">
      <nav className="pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-2xl border border-edge bg-surface/80 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {items.map((app, i) => {
          const active = isActive(pathname, app.href);
          const Icon = app.icon;
          return (
            <div key={app.id} className="flex items-end">
              {i === items.length - 1 && (
                <div className="mx-1.5 mb-4 h-10 w-px self-end bg-edge" />
              )}
              <Link
                href={app.href}
                target={app.newTab ? "_blank" : undefined}
                onClick={() => playSound("tap")}
                className="flex w-16 flex-col items-center sm:w-[4.5rem]"
              >
                <motion.span
                  whileHover={{ scale: 1.12, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`flex size-12 items-center justify-center rounded-xl border sm:size-13 ${
                    active
                      ? "border-edge-strong bg-surface-3 text-accent"
                      : "border-transparent text-ink-dim hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon className="size-6 sm:size-7" strokeWidth={1.75} />
                </motion.span>
                <span
                  className={`mt-1 text-[11px] font-medium sm:text-xs ${
                    active ? "text-ink" : "text-ink-dim"
                  }`}
                >
                  {app.name}
                </span>
                <span
                  className={`mt-0.5 size-1 rounded-full ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
              </Link>
            </div>
          );
        })}
      </nav>
    </footer>
  );
}
