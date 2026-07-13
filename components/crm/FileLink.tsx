"use client";

import { useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import { formatBytes, getSignedUrl, useWorkspaceFiles } from "@/lib/crm/files";

/**
 * A stored file rendered as a download link. The bucket is private, so the
 * signed URL is minted on click rather than at render time.
 */
export default function FileLink({
  path,
  name,
  size,
  className,
}: {
  path: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const { supabase } = useWorkspaceFiles();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const url = await getSignedUrl(supabase, path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Couldn't open the file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      title={error || name}
      className={
        className ??
        "inline-flex max-w-full items-center gap-1.5 text-sm text-accent hover:underline disabled:opacity-60"
      }
      disabled={busy}
    >
      {busy ? (
        <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
      ) : (
        <FileText className="size-3.5 shrink-0" />
      )}
      <span className="truncate">{error || name}</span>
      {size ? (
        <span className="shrink-0 text-xs text-ink-faint">{formatBytes(size)}</span>
      ) : null}
    </button>
  );
}
