"use client";

import type { CrmState } from "@/lib/crm/types";
import {
  exportAccounts,
  mintRecoveryCode,
  replaceAccounts,
  type Accounts,
} from "@/lib/accounts";

/**
 * Workspace backup: one JSON file holding the CRM state and the credentials
 * store. Exporting mints a fresh owner recovery code and embeds it, so the
 * latest backup file can always unlock the workspace — older codes are spent.
 */

const KIND = "franko-workspace-backup";
const VERSION = 1;
const LAST_BACKUP_KEY = "franko-last-backup-at";

export type WorkspaceBackup = {
  kind: typeof KIND;
  version: number;
  exportedAt: number;
  workspaceName: string;
  /** Plaintext recovery code minted at export time (owner accounts only). */
  recoveryCode: string | null;
  state: Omit<CrmState, "ui">;
  accounts: Accounts;
};

export async function buildBackup(state: CrmState): Promise<WorkspaceBackup> {
  const recoveryCode = await mintRecoveryCode();
  return {
    kind: KIND,
    version: VERSION,
    exportedAt: Date.now(),
    workspaceName: state.workspace.name,
    recoveryCode,
    state: { ...state, ui: undefined } as Omit<CrmState, "ui">,
    accounts: exportAccounts(),
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

/** Restore credentials from a backup; the caller imports the CRM state. */
export function restoreAccounts(backup: WorkspaceBackup) {
  replaceAccounts(backup.accounts ?? { owner: null, clients: {} });
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
