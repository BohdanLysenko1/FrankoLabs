"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { DesktopContext } from "./DesktopContext";
import BootScreen from "./BootScreen";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import CommandPalette from "./CommandPalette";
import ContextMenu, { type ContextMenuState } from "./ContextMenu";
import DesktopIcons from "./DesktopIcons";
import ThemeDialog from "./ThemeDialog";
import { usePortalAuth } from "@/lib/portal/auth";

export default function Desktop({ children }: { children: ReactNode }) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const { company } = usePortalAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menu, setMenu] = useState<ContextMenuState>(null);

  const ctx = useMemo(
    () => ({ desktopRef, openPalette: () => setPaletteOpen(true) }),
    [],
  );

  return (
    <DesktopContext.Provider value={ctx}>
      <div className="relative flex h-dvh flex-col overflow-hidden">
        <BootScreen />
        <MenuBar />
        <main
          ref={desktopRef}
          className="wallpaper relative flex-1 overflow-hidden"
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          {/* Ambient wallpaper glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="wallpaper-glow wallpaper-glow-a" />
            <div className="wallpaper-glow wallpaper-glow-b" />
          </div>
          <DesktopIcons />
          {children}
        </main>
        <Dock />
        <ThemeDialog />
        <CommandPalette
          open={paletteOpen}
          setOpen={setPaletteOpen}
          scope="site"
          company={company}
        />
        <ContextMenu
          state={menu}
          onClose={() => setMenu(null)}
          openPalette={() => setPaletteOpen(true)}
        />
      </div>
    </DesktopContext.Provider>
  );
}
