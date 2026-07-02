"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useDesktop } from "./DesktopContext";

type WidgetProps = {
  /** Mono widget name shown in the mini titlebar, e.g. "modules.grid". */
  name: string;
  className?: string;
  delay?: number;
  children: ReactNode;
};

/** A mini draggable window used for dashboard widgets. */
export default function Widget({ name, className = "", delay = 0, children }: WidgetProps) {
  const { desktopRef } = useDesktop();

  return (
    <motion.div
      drag
      dragConstraints={desktopRef}
      dragMomentum={false}
      dragElastic={0.08}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={`overflow-hidden rounded-xl border border-edge bg-surface/85 shadow-xl shadow-black/40 backdrop-blur-md ${className}`}
    >
      <div className="flex cursor-grab items-center gap-2 border-b border-edge px-4 py-2 active:cursor-grabbing">
        <span className="hex size-2.5 bg-accent/60" />
        <span className="text-xs font-medium tracking-wide text-ink-dim">
          {name}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}
