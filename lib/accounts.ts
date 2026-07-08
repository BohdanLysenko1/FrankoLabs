"use client";

import { useSyncExternalStore } from "react";

/**
 * Credentials for the workspace, stored separately from the CRM state so
 * "Reset workspace" never deletes the owner account or client passwords.
 * Secrets are salted SHA-256 hashes — plaintext never touches disk. This is
 * casual-access protection for a shared screen, not encryption: the workspace
 * data itself stays readable in localStorage until a real backend arrives.
 *
 * Module-level store (not a React context) because two separate trees — the
 * /crm app and the (site) portal — both need it.
 */

const STORAGE_KEY = "franko-accounts-v1";
const OWNER_SESSION_KEY = "franko-owner-session";

export type OwnerAccount = {
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  /** Hash of the one-time recovery code; the plaintext is shown once. */
  recoveryHash: string;
  createdAt: number;
};

export type ClientCredential = {
  salt: string;
  passwordHash: string;
  setAt: number;
};

export type Accounts = {
  owner: OwnerAccount | null;
  /** Keyed by CRM company id — a client "account" is their company. */
  clients: Record<string, ClientCredential>;
};

const EMPTY: Accounts = { owner: null, clients: {} };

/** ?noonboard=1 sessions (tests/screenshots) never read or write real creds. */
function isEphemeralSession(): boolean {
  return (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("noonboard")
  );
}

// ---------------------------------------------------------------------------
// Store plumbing

let cache: Accounts | null = null;
let sessionCache: boolean | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function readAccounts(): Accounts {
  if (cache) return cache;
  if (typeof window === "undefined" || isEphemeralSession()) return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Accounts>;
      cache = {
        owner: saved.owner ?? null,
        clients: saved.clients ?? {},
      };
      return cache;
    }
  } catch {
    // Corrupt save — treat as no accounts rather than locking anyone out.
  }
  cache = EMPTY;
  return cache;
}

function writeAccounts(next: Accounts) {
  cache = next;
  if (!isEphemeralSession()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable — credentials live in memory for this visit.
    }
  }
  emit();
}

function readOwnerSession(): boolean {
  if (sessionCache !== null) return sessionCache;
  if (typeof window === "undefined" || isEphemeralSession()) return false;
  try {
    sessionCache = localStorage.getItem(OWNER_SESSION_KEY) !== null;
  } catch {
    sessionCache = false;
  }
  return sessionCache;
}

function writeOwnerSession(signedIn: boolean) {
  sessionCache = signedIn;
  if (!isEphemeralSession()) {
    try {
      if (signedIn) {
        localStorage.setItem(
          OWNER_SESSION_KEY,
          JSON.stringify({ at: Date.now() }),
        );
      } else {
        localStorage.removeItem(OWNER_SESSION_KEY);
      }
    } catch {
      // Storage unavailable — session lives in memory for this visit.
    }
  }
  emit();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cache = null;
    if (e.key === OWNER_SESSION_KEY) sessionCache = null;
    if (e.key === STORAGE_KEY || e.key === OWNER_SESSION_KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** Live view of the credentials store. Server snapshot is "no accounts". */
export function useAccounts(): Accounts {
  return useSyncExternalStore(subscribe, readAccounts, () => EMPTY);
}

/** Whether the owner is signed in on this browser (until sign-out). */
export function useOwnerSession(): boolean {
  return useSyncExternalStore(subscribe, readOwnerSession, () => false);
}

// ---------------------------------------------------------------------------
// Hashing

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

async function hashSecret(salt: string, secret: string): Promise<string> {
  const data = new TextEncoder().encode(`franko:v1:${salt}:${secret}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

/** Human-typable one-time code, e.g. FRNK-7KQ2-M9XW-4BJP. */
function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  const chars = Array.from(arr, (b) => alphabet[b % alphabet.length]);
  const groups = [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8, 12)];
  return `FRNK-${groups.map((g) => g.join("")).join("-")}`;
}

/** Recovery codes are compared case- and dash-insensitively. */
function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Owner account

/** Create the owner account and return the one-time recovery code. */
export async function createOwner(input: {
  name: string;
  email: string;
  password: string;
}): Promise<string> {
  const salt = randomToken();
  const code = generateRecoveryCode();
  const owner: OwnerAccount = {
    name: input.name,
    email: input.email,
    salt,
    passwordHash: await hashSecret(salt, input.password),
    recoveryHash: await hashSecret(salt, normalizeRecoveryCode(code)),
    createdAt: Date.now(),
  };
  writeAccounts({ ...readAccounts(), owner });
  writeOwnerSession(true);
  return code;
}

export async function verifyOwnerPassword(password: string): Promise<boolean> {
  const { owner } = readAccounts();
  if (!owner) return false;
  return (await hashSecret(owner.salt, password)) === owner.passwordHash;
}

export async function ownerSignIn(password: string): Promise<boolean> {
  const ok = await verifyOwnerPassword(password);
  if (ok) writeOwnerSession(true);
  return ok;
}

export function ownerSignOut() {
  writeOwnerSession(false);
}

export async function changeOwnerPassword(
  current: string,
  next: string,
): Promise<boolean> {
  const { owner } = readAccounts();
  if (!owner || !(await verifyOwnerPassword(current))) return false;
  writeAccounts({
    ...readAccounts(),
    owner: { ...owner, passwordHash: await hashSecret(owner.salt, next) },
  });
  return true;
}

/**
 * Reset the owner password with the recovery code. Returns a fresh recovery
 * code on success (the old one is spent), or null if the code is wrong.
 * Does NOT open a session — the lock screen shows the new code first and
 * calls openOwnerSession() once it's acknowledged.
 */
export async function resetOwnerWithRecovery(
  code: string,
  newPassword: string,
): Promise<string | null> {
  const { owner } = readAccounts();
  if (!owner) return null;
  const given = await hashSecret(owner.salt, normalizeRecoveryCode(code));
  if (given !== owner.recoveryHash) return null;
  const nextCode = generateRecoveryCode();
  writeAccounts({
    ...readAccounts(),
    owner: {
      ...owner,
      passwordHash: await hashSecret(owner.salt, newPassword),
      recoveryHash: await hashSecret(owner.salt, normalizeRecoveryCode(nextCode)),
    },
  });
  return nextCode;
}

/** Open the owner session after an already-verified step (recovery reset). */
export function openOwnerSession() {
  writeOwnerSession(true);
}

/**
 * Mint a replacement recovery code (invalidates the previous one). Used when
 * exporting a backup so the file can always unlock the workspace.
 */
export async function mintRecoveryCode(): Promise<string | null> {
  const { owner } = readAccounts();
  if (!owner) return null;
  const code = generateRecoveryCode();
  writeAccounts({
    ...readAccounts(),
    owner: {
      ...owner,
      recoveryHash: await hashSecret(owner.salt, normalizeRecoveryCode(code)),
    },
  });
  return code;
}

// ---------------------------------------------------------------------------
// Client credentials

export async function setClientPassword(
  companyId: string,
  password: string,
): Promise<void> {
  const salt = randomToken();
  const cred: ClientCredential = {
    salt,
    passwordHash: await hashSecret(salt, password),
    setAt: Date.now(),
  };
  const accounts = readAccounts();
  writeAccounts({
    ...accounts,
    clients: { ...accounts.clients, [companyId]: cred },
  });
}

export async function verifyClientPassword(
  companyId: string,
  password: string,
): Promise<boolean> {
  const cred = readAccounts().clients[companyId];
  if (!cred) return false;
  return (await hashSecret(cred.salt, password)) === cred.passwordHash;
}

/** Revoke a client's password so their next invite link sets a new one. */
export function clearClientCredential(companyId: string) {
  const accounts = readAccounts();
  if (!accounts.clients[companyId]) return;
  const clients = { ...accounts.clients };
  delete clients[companyId];
  writeAccounts({ ...accounts, clients });
}

// ---------------------------------------------------------------------------
// Backup

export function exportAccounts(): Accounts {
  return readAccounts();
}

/** Replace all credentials from an imported backup. */
export function replaceAccounts(accounts: Accounts) {
  writeAccounts({
    owner: accounts.owner ?? null,
    clients: accounts.clients ?? {},
  });
}
