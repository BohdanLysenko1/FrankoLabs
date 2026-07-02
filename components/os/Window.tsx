"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useDragControls } from "framer-motion";
import { X, Minus, Maximize2 } from "lucide-react";
import { useDesktop } from "./DesktopContext";
import { playSound } from "@/lib/sound";

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
  const { desktopRef } = useDesktop();
  const dragControls = useDragControls();
  const isDesktop = useIsDesktopViewport();
  const [maximized, setMaximized] = useState(false);
  const [leaving, setLeaving] = useState<"close" | "minimize" | null>(null);

  const draggable = isDesktop && !maximized;

  useEffect(() => {
    playSound("open");
  }, []);

  const close = () => {
    playSound("close");
    setLeaving("close");
    setTimeout(() => router.push("/"), 180);
  };

  const minimize = () => {
    playSound("close");
    setLeaving("minimize");
    setTimeout(() => router.push("/"), 380);
  };

  const animate =
    leaving === "close"
      ? { opacity: 0, scale: 0.96, y: 12 }
      : leaving === "minimize"
        ? { opacity: 0, scale: 0.05, y: 560 }
        : { opacity: 1, scale: 1, y: 0 };

  return (
    <div className="absolute inset-0 flex justify-center overflow-hidden md:p-6 md:pb-32">
      <motion.section
        drag={draggable}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={desktopRef}
        dragMomentum={false}
        dragElastic={0.08}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={animate}
        transition={
          leaving === "minimize"
            ? { duration: 0.38, ease: [0.5, 0, 0.8, 0.4] }
            : { duration: 0.18, ease: "easeOut" }
        }
        onContextMenu={(e) => e.stopPropagation()}
        className={`flex w-full flex-col overflow-hidden border-edge bg-surface shadow-2xl shadow-black/60 md:rounded-xl md:border ${
          maximized ? "md:max-w-none" : sizes[size]
        }`}
      >
        <div
          className="relative flex h-12 shrink-0 cursor-grab select-none items-center gap-3 border-b border-edge bg-surface-2/60 px-4 active:cursor-grabbing"
          onPointerDown={(e) => draggable && dragControls.start(e)}
          onDoubleClick={() => setMaximized((m) => !m)}
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
              title="Minimize"
              onClick={minimize}
              className="hex flex size-5 items-center justify-center bg-surface-3 text-ink-dim transition hover:bg-accent hover:text-black"
            >
              <Minus className="size-3" strokeWidth={2.5} />
            </button>
            <button
              aria-label="Maximize window"
              title={maximized ? "Restore" : "Expand"}
              onClick={() => setMaximized((m) => !m)}
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

        <div className="os-scroll flex-1 overflow-y-auto pb-32 md:pb-0">
          {children}
        </div>
      </motion.section>
    </div>
  );
}
