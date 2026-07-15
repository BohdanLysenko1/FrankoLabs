"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TerminalSquare } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-desktop p-6">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface-2/80 p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-edge bg-surface-3 text-ink-faint">
          <TerminalSquare className="size-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">
          Something crashed
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-dim">
          This window hit an unexpected error. Your data is safe — try
          reloading the view.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-faint">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-edge px-5 py-2.5 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            Back to desktop
          </Link>
        </div>
      </div>
    </div>
  );
}
