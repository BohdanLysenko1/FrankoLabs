"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/session";
import type { TicketAttachment } from "./types";

/**
 * Uploads to the private `workspace-files` bucket. Paths encode ownership —
 * storage RLS keys off the first two segments, so always build them from
 * store state, never from user input:
 *   {workspace_id}/{company_id}/deliverables/{deliverable_id}/{filename}
 *   {workspace_id}/{company_id}/tickets/{ticket_id}/{filename}
 */

export const WORKSPACE_FILES_BUCKET = "workspace-files";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

type Supabase = ReturnType<typeof createClient>;

const sanitizeName = (name: string): string =>
  name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "file";

export async function uploadWorkspaceFile(
  supabase: Supabase,
  input: {
    workspaceId: string;
    companyId: string;
    scope: "deliverables" | "tickets";
    recordId: string;
    file: File;
  },
): Promise<TicketAttachment> {
  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw new Error("That file is over the 50 MB limit.");
  }
  const path = `${input.workspaceId}/${input.companyId}/${input.scope}/${input.recordId}/${sanitizeName(input.file.name)}`;
  const { error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .upload(path, input.file, { upsert: true, contentType: input.file.type || undefined });
  if (error) throw new Error(error.message);
  return {
    path,
    name: input.file.name,
    size: input.file.size,
    mime: input.file.type || "application/octet-stream",
  };
}

export async function getSignedUrl(supabase: Supabase, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(WORKSPACE_FILES_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open the file.");
  return data.signedUrl;
}

/** Browser client + workspace id for upload/download from components. */
export function useWorkspaceFiles(): { supabase: Supabase; workspaceId: string | null } {
  const session = useSession();
  const supabase = useMemo(() => createClient(), []);
  return {
    supabase,
    workspaceId:
      session.membership?.workspaceId ?? session.clientAccess?.workspaceId ?? null,
  };
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
