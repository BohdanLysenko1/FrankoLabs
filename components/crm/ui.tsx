"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { initials } from "@/lib/crm/types";

/** Shared UI primitives for the CRM app — same design language as Franko OS. */

export function Avatar({
  name,
  hue,
  size = "md",
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "sm"
      ? "size-6 text-[10px]"
      : size === "lg"
        ? "size-12 text-base"
        : "size-8 text-xs";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-medium ${cls}`}
      style={{
        backgroundColor: `hsl(${hue} 45% 22%)`,
        color: `hsl(${hue} 70% 78%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-edge bg-surface-2/65 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-xl text-base leading-relaxed text-ink-dim">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-black transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-2/80 px-4 py-2 text-sm font-medium text-ink-dim transition hover:border-edge-strong hover:text-ink disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-dim">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-edge bg-surface-2/80 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition focus:border-accent/50 focus:bg-surface-2";

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="os-scroll absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto border-l border-edge bg-surface p-6 shadow-2xl shadow-black/60">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-lg p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="os-scroll relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-edge bg-surface p-6 shadow-2xl shadow-black/60">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-ink-dim transition hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-edge py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-edge bg-surface-2 text-ink-dim">
        {icon}
      </div>
      <p className="mt-4 text-base font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-base leading-relaxed text-ink-dim">{hint}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
