"use client";

import type { ReactNode, RefObject } from "react";
import { motion } from "framer-motion";

type WidgetProps = {
  /** Mono widget name shown in the mini titlebar, e.g. "modules.grid". */
  name: string;
  /**
   * Element the widget can be dragged within. Must scroll together with the
   * widget (a wrapper inside the same scroll container) — framer-motion
   * resolves ref constraints once, so a fixed element like the desktop goes
   * stale as soon as the page scrolls and flings the widget off-screen.
   */
  constraintsRef: RefObject<HTMLElement | null>;
  className?: string;
  delay?: number;
  children: ReactNode;
};

/** A mini draggable window used for dashboard widgets. */
export default function Widget({
  name,
  constraintsRef,
  className = "",
  delay = 0,
  children,
}: WidgetProps) {
  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragMomentum={false}
      dragElastic={0.08}
      className={`os-widget overflow-hidden rounded-xl border border-edge bg-surface/95 shadow-xl shadow-black/40 backdrop-blur-md ${className}`}
    >
      {/* Entrance animates an inner element: a transform on the draggable
          itself would skew the layout box framer measures for constraints. */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
      >
        <div className="os-widget-head flex cursor-grab items-center gap-2 border-b border-edge bg-surface-2/80 px-4 py-2 active:cursor-grabbing">
          <span className="hex size-2.5 bg-accent/60" />
          <span className="text-xs font-medium tracking-wide text-ink-dim">
            {name}
          </span>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}
