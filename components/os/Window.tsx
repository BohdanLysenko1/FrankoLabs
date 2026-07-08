"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate, motion, useMotionValue } from "framer-motion";
import { X, Minus, Maximize2, Square } from "lucide-react";
import { useDesktop } from "./DesktopContext";
import LogoMark from "./LogoMark";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";
import {
  defaultWindowLayout,
  hasWindowLayout,
  loadWindowLayout,
  minimizeWindow,
  restoreWindow,
  saveWindowLayout,
  subscribeWindows,
  type SnapZone,
  type WindowLayout,
} from "@/lib/windows";

type WindowProps = {
  /** Window title, shown in the titlebar. */
  title: string;
  /** Mono path shown next to the title, e.g. "~/solutions". */
  path?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
};

const sizes = {
  md: "md:max-w-2xl",
  lg: "md:max-w-4xl",
  xl: "md:max-w-5xl",
};

const sizePx = { md: 672, lg: 896, xl: 1024 };

const GAP = 12;
const EDGE = 20;
const MIN_W = 420;
const MIN_H = 300;

type DragZone = SnapZone | "max";

type Rect = { left: number; top: number; width: number; height: number };

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function snapRect(
  zone: DragZone,
  dw: number,
  dh: number,
  dockReserve: number,
): Rect {
  const x = GAP;
  const y = GAP;
  const w = dw - GAP * 2;
  const h = dh - GAP - dockReserve;
  const w2 = (w - GAP) / 2;
  const h2 = (h - GAP) / 2;
  switch (zone) {
    case "max":
      return { left: x, top: y, width: w, height: h };
    case "left":
      return { left: x, top: y, width: w2, height: h };
    case "right":
      return { left: x + w2 + GAP, top: y, width: w2, height: h };
    case "tl":
      return { left: x, top: y, width: w2, height: h2 };
    case "tr":
      return { left: x + w2 + GAP, top: y, width: w2, height: h2 };
    case "bl":
      return { left: x, top: y + h2 + GAP, width: w2, height: h2 };
    case "br":
      return { left: x + w2 + GAP, top: y + h2 + GAP, width: w2, height: h2 };
  }
}

function zoneAt(
  x: number,
  y: number,
  dw: number,
  dh: number,
  dockReserve: number,
): DragZone | null {
  const usableH = dh - dockReserve;
  if (x < EDGE)
    return y < usableH * 0.3 ? "tl" : y > usableH * 0.7 ? "bl" : "left";
  if (x > dw - EDGE)
    return y < usableH * 0.3 ? "tr" : y > usableH * 0.7 ? "br" : "right";
  if (y < EDGE) return "max";
  return null;
}

function rectFor(
  layout: WindowLayout,
  dw: number,
  dh: number,
  size: keyof typeof sizePx,
  dockReserve: number,
): Rect {
  if (layout.maximized) return snapRect("max", dw, dh, dockReserve);
  if (layout.snap) return snapRect(layout.snap, dw, dh, dockReserve);
  const maxW = dw - GAP * 2;
  const maxH = dh - GAP - dockReserve;
  const width = clamp(layout.w ?? Math.min(sizePx[size], maxW), MIN_W, maxW);
  const height = clamp(layout.h ?? maxH, MIN_H, maxH);
  const left = clamp(
    layout.x ?? (dw - width) / 2,
    -width + 160,
    dw - 160,
  );
  const top = clamp(layout.y ?? GAP, 0, dh - dockReserve - 48);
  return { left, top, width, height };
}

function useIsDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export default function Window({ title, path, size = "lg", children }: WindowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { desktopRef } = useDesktop();
  const isDesktop = useIsDesktopViewport();
  const retro = useTheme() === "xp";
  const [leaving, setLeaving] = useState<"close" | "minimize" | null>(null);

  const windowKey = title.toLowerCase().replace(/\W+/g, "-");
  const dockReserve = retro ? GAP : 124;

  const [layout, setLayout] = useState<WindowLayout>(defaultWindowLayout);
  const layoutRef = useRef(layout);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<Rect | null>(null);
  const zoneRef = useRef<DragZone | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  const mvLeft = useMotionValue(0);
  const mvTop = useMotionValue(0);
  const mvW = useMotionValue(0);
  const mvH = useMotionValue(0);

  const applyLayout = useCallback(
    (next: WindowLayout, animated: boolean) => {
      const el = desktopRef.current;
      if (!el) return;
      const r = rectFor(next, el.clientWidth, el.clientHeight, size, dockReserve);
      if (animated) {
        const opts = { duration: 0.26, ease: [0.32, 0.72, 0, 1] as const };
        animate(mvLeft, r.left, opts);
        animate(mvTop, r.top, opts);
        animate(mvW, r.width, opts);
        animate(mvH, r.height, opts);
      } else {
        mvLeft.set(r.left);
        mvTop.set(r.top);
        mvW.set(r.width);
        mvH.set(r.height);
      }
    },
    [desktopRef, size, dockReserve, mvLeft, mvTop, mvW, mvH],
  );

  const commit = useCallback(
    (next: WindowLayout, animated = true) => {
      layoutRef.current = next;
      setLayout(next);
      saveWindowLayout(windowKey, next);
      applyLayout(next, animated);
    },
    [windowKey, applyLayout],
  );

  useEffect(() => {
    playSound("open");
  }, []);

  // Coming back to this route restores it from the dock's minimized list.
  useEffect(() => {
    restoreWindow(pathname);
  }, [pathname]);

  useEffect(() => {
    const restore = () => {
      if (!isDesktop) {
        setReady(false);
        return;
      }
      const saved = loadWindowLayout(windowKey);
      layoutRef.current = saved;
      setLayout(saved);
      applyLayout(saved, false);
      setReady(true);
    };
    restore();
  }, [isDesktop, windowKey, applyLayout]);

  // Keep the window inside the desktop when the browser resizes, and follow
  // "reset layout" fired from the context menu or command palette.
  useEffect(() => {
    if (!ready) return;
    const onResize = () => applyLayout(layoutRef.current, false);
    window.addEventListener("resize", onResize);
    const unsubscribe = subscribeWindows(() => {
      if (!hasWindowLayout(windowKey) && layoutRef.current !== defaultWindowLayout) {
        layoutRef.current = defaultWindowLayout;
        setLayout(defaultWindowLayout);
        applyLayout(defaultWindowLayout, true);
      }
    });
    return () => {
      window.removeEventListener("resize", onResize);
      unsubscribe();
    };
  }, [ready, windowKey, applyLayout]);

  const startDrag = (e: React.PointerEvent) => {
    if (!isDesktop || !ready || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const el = desktopRef.current;
    const sec = sectionRef.current;
    if (!el || !sec) return;
    e.preventDefault();
    const dRect = el.getBoundingClientRect();
    const dw = dRect.width;
    const dh = dRect.height;
    const sRect = sec.getBoundingClientRect();
    let grabX = e.clientX - sRect.left;
    const grabY = Math.min(e.clientY - sRect.top, 36);

    const current = layoutRef.current;
    if (current.maximized || current.snap) {
      // Dragging out of a snap: the window floats again under the pointer.
      const base = { ...current, snap: null, maximized: false };
      const fr = rectFor(base, dw, dh, size, dockReserve);
      grabX = clamp(fr.width * (grabX / sRect.width), 60, fr.width - 60);
      mvW.set(fr.width);
      mvH.set(fr.height);
      layoutRef.current = base;
      setLayout(base);
    }

    const move = (ev: PointerEvent) => {
      const lx = ev.clientX - dRect.left;
      const ly = ev.clientY - dRect.top;
      mvLeft.set(clamp(lx - grabX, -mvW.get() + 120, dw - 120));
      mvTop.set(clamp(ly - grabY, 0, dh - 60));
      const z = zoneAt(lx, ly, dw, dh, dockReserve);
      if (z !== zoneRef.current) {
        zoneRef.current = z;
        setPreview(z ? snapRect(z, dw, dh, dockReserve) : null);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const z = zoneRef.current;
      zoneRef.current = null;
      setPreview(null);
      const base = layoutRef.current;
      if (z === "max") commit({ ...base, snap: null, maximized: true });
      else if (z) commit({ ...base, snap: z, maximized: false });
      else
        commit(
          {
            ...base,
            x: mvLeft.get(),
            y: mvTop.get(),
            snap: null,
            maximized: false,
          },
          false,
        );
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const startResize = (e: React.PointerEvent) => {
    if (!isDesktop || !ready || e.button !== 0) return;
    const el = desktopRef.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const dRect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = mvW.get();
    const startH = mvH.get();
    const left = mvLeft.get();
    const top = mvTop.get();

    const move = (ev: PointerEvent) => {
      mvW.set(
        clamp(startW + ev.clientX - startX, MIN_W, dRect.width - left - GAP),
      );
      mvH.set(
        clamp(startH + ev.clientY - startY, MIN_H, dRect.height - top - GAP),
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      commit(
        {
          ...layoutRef.current,
          x: left,
          y: top,
          w: mvW.get(),
          h: mvH.get(),
          snap: null,
          maximized: false,
        },
        false,
      );
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const toggleMaximize = () => {
    if (!isDesktop || !ready) return;
    const base = layoutRef.current;
    commit({ ...base, maximized: !base.maximized, snap: null });
  };

  const close = () => {
    playSound("close");
    setLeaving("close");
    setTimeout(() => router.push("/"), 180);
  };

  const minimize = () => {
    playSound("close");
    minimizeWindow({ title, href: pathname });
    setLeaving("minimize");
    setTimeout(() => router.push("/"), 380);
  };

  const floating = ready && isDesktop;
  const maximized = layout.maximized;

  const animateTo =
    leaving === "close"
      ? { opacity: 0, scale: 0.96, y: 12 }
      : leaving === "minimize"
        ? { opacity: 0, scale: 0.05, y: 560 }
        : { opacity: 1, scale: 1, y: 0 };

  return (
    <div className="absolute inset-0 flex justify-center overflow-hidden md:p-6 md:pb-32">
      {preview && floating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`pointer-events-none absolute z-10 border-2 border-accent/50 bg-accent-dim ${
            retro ? "" : "rounded-xl"
          }`}
          style={preview}
        />
      )}
      <motion.section
        ref={sectionRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={animateTo}
        transition={
          leaving === "minimize"
            ? { duration: 0.38, ease: [0.5, 0, 0.8, 0.4] }
            : { duration: 0.18, ease: "easeOut" }
        }
        onContextMenu={(e) => e.stopPropagation()}
        style={
          floating
            ? {
                position: "absolute",
                left: mvLeft,
                top: mvTop,
                width: mvW,
                height: mvH,
              }
            : undefined
        }
        className={`relative flex flex-col overflow-hidden border-edge bg-surface shadow-2xl shadow-black/60 md:rounded-xl md:border ${
          retro ? "xp-window" : ""
        } ${floating ? "" : `w-full ${sizes[size]}`}`}
      >
        {retro ? (
          <div
            className="xp-titlebar relative flex h-9 shrink-0 cursor-grab select-none items-center gap-2 px-2 active:cursor-grabbing"
            onPointerDown={startDrag}
            onDoubleClick={toggleMaximize}
          >
            <LogoMark className="h-4 w-auto shrink-0" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {title}
              {path && (
                <span className="ml-2 hidden text-xs font-normal opacity-70 sm:inline">
                  {path}
                </span>
              )}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                aria-label="Minimize window"
                title="Minimize to dock"
                onClick={minimize}
                className="xp-ctrl"
              >
                <Minus className="mt-2 size-3" strokeWidth={3} />
              </button>
              <button
                aria-label="Maximize window"
                title={maximized ? "Restore" : "Maximize"}
                onClick={toggleMaximize}
                className="xp-ctrl"
              >
                <Square className="size-3" strokeWidth={3} />
              </button>
              <button
                aria-label="Close window"
                title="Close"
                onClick={close}
                className="xp-ctrl xp-ctrl-close"
              >
                <X className="size-3.5" strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="relative flex h-12 shrink-0 cursor-grab select-none items-center gap-3 border-b border-edge bg-surface-2/60 px-4 active:cursor-grabbing"
            onPointerDown={startDrag}
            onDoubleClick={toggleMaximize}
          >
            <div className="flex items-center gap-1.5">
              <button
                aria-label="Close window"
                title="Close"
                onClick={close}
                className="hex flex size-5 items-center justify-center bg-surface-3 text-ink-dim transition hover:bg-accent hover:text-black"
              >
                <X className="size-3" strokeWidth={2.5} />
              </button>
              <button
                aria-label="Minimize window"
                title="Minimize to dock"
                onClick={minimize}
                className="hex flex size-5 items-center justify-center bg-surface-3 text-ink-dim transition hover:bg-accent hover:text-black"
              >
                <Minus className="size-3" strokeWidth={2.5} />
              </button>
              <button
                aria-label="Maximize window"
                title={maximized ? "Restore" : "Expand"}
                onClick={toggleMaximize}
                className="hex flex size-5 items-center justify-center bg-surface-3 text-ink-dim transition hover:bg-accent hover:text-black"
              >
                <Maximize2 className="size-2.5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="pointer-events-none absolute inset-x-0 flex justify-center">
              <span className="flex items-center gap-2 text-[15px] font-medium">
                {title}
                {path && (
                  <span className="hidden font-mono text-xs text-ink-faint sm:inline">
                    {path}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="os-scroll flex-1 overflow-y-auto pb-32 md:pb-0">
          {children}
        </div>

        {floating && !maximized && (
          <div
            aria-hidden
            onPointerDown={startResize}
            className="absolute bottom-0 right-0 z-10 size-4 cursor-nwse-resize"
          />
        )}
      </motion.section>
    </div>
  );
}
