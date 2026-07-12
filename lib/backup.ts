"use client";

import type { CrmState } from "@/lib/crm/types";

/**
 * Workspace backup: one JSON file holding the CRM state. Since v2 credentials
 * live in Supabase Auth, so backups carry data only — restoring imports the
 * records into whatever workspace you're signed into. v1 files (which bundled
 * the old localStorage credential store) still import; their accounts blob is
 * ignored.
 */

const KIND = "franko-workspace-backup";
const VERSION = 2;
const LAST_BACKUP_KEY = "franko-last-backup-at";

export type WorkspaceBackup = {
  kind: typeof KIND;
  version: number;
  exportedAt: number;
  workspaceName: string;
  state: Omit<CrmState, "ui">;
};

export function buildBackup(state: CrmState): WorkspaceBackup {
  return {
    kind: KIND,
    version: VERSION,
    exportedAt: Date.now(),
    workspaceName: state.workspace.name,
    state: { ...state, ui: undefined } as Omit<CrmState, "ui">,
  };
}

export function downloadBackup(backup: WorkspaceBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date(backup.exportedAt).toISOString().slice(0, 10);
  const slug = backup.workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  a.href = url;
  a.download = `${slug || "franko-workspace"}-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setLastBackupAt(backup.exportedAt);
}

/** Parse an uploaded file; null if it isn't a Franko workspace backup. */
export function parseBackup(text: string): WorkspaceBackup | null {
  try {
    const data = JSON.parse(text) as Partial<WorkspaceBackup>;
    if (
      data.kind !== KIND ||
      typeof data.version !== "number" ||
      data.version > VERSION ||
      !data.state ||
      !Array.isArray(data.state.companies)
    ) {
      return null;
    }
    return data as WorkspaceBackup;
  } catch {
    return null;
  }
}

export function getLastBackupAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    return raw ? Number(raw) || null : null;
  } catch {
    return null;
  }
}

function setLastBackupAt(at: number) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(at));
  } catch {
    // Storage unavailable — the timestamp is only a convenience.
  }
}

/**
 * The previous app generation kept the whole workspace in this localStorage
 * key — the one-time import tool reads it after first sign-in.
 */
export function readLegacyLocalWorkspace(): Partial<CrmState> | null {
  try {
    const raw = localStorage.getItem("franko-crm-state-v2");
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<CrmState>;
    if (!saved || !Array.isArray(saved.companies) || !Array.isArray(saved.deals)) {
      return null;
    }
    // The untouched sample workspace isn't worth importing.
    if (!saved.onboarded) return null;
    return saved;
  } catch {
    return null;
  }
}
