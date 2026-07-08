"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apps } from "@/lib/apps";
import { usePortalAuth } from "@/lib/portal/auth";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";

/**
 * XP-style desktop icons (retro theme only). First click selects,
 * second click — or double-click / Enter — opens. They sit behind
 * open windows, just like a real desktop.
 */
export default function DesktopIcons() {
  const router = useRouter();
  const { company } = usePortalAuth();
  const retro = useTheme() === "xp";
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const clear = () => setSelected(null);
    window.addEventListener("pointerdown", clear);
    return () => window.removeEventListener("pointerdown", clear);
  }, [selected]);

  // Signed-in clients get their own desktop; icons are for visitors.
  if (!retro || company) return null;

  const icons = apps.filter((a) => a.href !== "/");

  const open = (href: string, newTab?: boolean) => {
    playSound("open");
    if (newTab) window.open(href, "_blank", "noopener");
    else router.push(href);
  };

  return (
    <div className="absolute left-3 top-3 z-0 hidden flex-col gap-4 md:flex">
      {icons.map((app) => {
        const Icon = app.icon;
        const isSelected = selected === app.id;
        return (
          <button
            key={app.id}
            data-selected={isSelected}
            title={app.description}
            className="xp-icon flex flex-col items-center gap-1 text-center"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (isSelected) {
                open(app.href, app.newTab);
              } else {
                playSound("tap");
                setSelected(app.id);
              }
            }}
            onDoubleClick={() => open(app.href, app.newTab)}
            onKeyDown={(e) => e.key === "Enter" && open(app.href, app.newTab)}
          >
            <Icon className="size-9" strokeWidth={1.5} />
            <span className="xp-icon-label text-xs font-medium leading-tight">
              {app.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
