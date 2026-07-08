"use client";

import { LayoutGrid, Moon, Sun } from "lucide-react";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";
import { openThemeDialog } from "./ThemeDialog";

const themeMeta = {
  dark: { icon: Moon, label: "Theme: dark — change theme…" },
  light: { icon: Sun, label: "Theme: light — change theme…" },
  xp: { icon: LayoutGrid, label: "Theme: retro XP — change theme…" },
} as const;

/**
 * Shows the current theme and opens the theme chooser window.
 * Used in the site menu bar and CRM topbar; the matching ThemeDialog
 * is mounted once per shell.
 */
export default function ThemeToggle() {
  const theme = useTheme();
  const { icon: Icon, label } = themeMeta[theme];

  return (
    <button
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink-dim"
      onClick={() => {
        playSound("palette");
        openThemeDialog();
      }}
    >
      <Icon className="size-4" />
    </button>
  );
}
