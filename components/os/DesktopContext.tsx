"use client";

import { createContext, useContext, type RefObject } from "react";

type DesktopContextValue = {
  /** The desktop area element — used as drag constraints for windows and widgets. */
  desktopRef: RefObject<HTMLDivElement | null>;
  openPalette: () => void;
};

export const DesktopContext = createContext<DesktopContextValue | null>(null);

export function useDesktop() {
  const ctx = useContext(DesktopContext);
  if (!ctx) throw new Error("useDesktop must be used inside <Desktop>");
  return ctx;
}
