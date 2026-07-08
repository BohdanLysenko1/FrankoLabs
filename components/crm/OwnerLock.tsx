"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import {
  openOwnerSession,
  ownerSignIn,
  resetOwnerWithRecovery,
  useAccounts,
} from "@/lib/accounts";
import { playSound } from "@/lib/sound";
import { inputCls } from "./ui";

/**
 * The /crm sign-in screen, shown when an owner account exists but no session
 * does. Recovery flow: the one-time code resets the password and mints a
 * fresh code (the old one is spent).
 */
export default function OwnerLock() {
  const { owner } = useAccounts();
  const [mode, setMode] = useState<"signin" | "recovery">("signin");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!owner) return null;

  const submitSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await ownerSignIn(password);
    setBusy(false);
    if (ok) {
      playSound("open");
    } else {
      setError("That password isn't right.");
      setPassword("");
    }
  };

  const submitRecovery = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("New password needs at least 8 characters.");
      return;
    }
    setBusy(true);
    const minted = await resetOwnerWithRecovery(code, newPassword);
    setBusy(false);
    if (minted) {
      setNewCode(minted);
      setError(null);
    } else {
      setError("That recovery code doesn't match.");
    }
  };

  const copyNewCode = async () => {
    if (!newCode) return;
    try {
      await navigator.clipboard.writeText(newCode);
      setCopied(true);
    } catch {
      window.prompt("Recovery code:", newCode);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-desktop p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-2xl shadow-black/50">
          <AnimatePresence mode="wait">
            {newCode ? (
              // Recovery succeeded — the session is open, but the new code
              // must be saved before continuing.
              <motion.div
                key="newcode"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ShieldCheck className="size-9 text-accent" />
                <h1 className="mt-4 text-xl font-semibold tracking-tight">
                  Password reset — here&apos;s your new recovery code
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                  The old code is spent. Save this one somewhere safe; it&apos;s
                  shown once.
                </p>
                <button
                  onClick={copyNewCode}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-dim/50 px-4 py-3.5 text-left font-mono text-base tracking-wider transition hover:border-accent/70"
                >
                  {newCode}
                  {copied ? (
                    <Check className="size-4 shrink-0 text-accent" />
                  ) : (
                    <Copy className="size-4 shrink-0 text-ink-dim" />
                  )}
                </button>
                <button
                  onClick={() => {
                    playSound("open");
                    openOwnerSession();
                  }}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
                >
                  I&apos;ve saved it — open my workspace
                  <ArrowRight className="size-4" />
                </button>
              </motion.div>
            ) : mode === "signin" ? (
              <motion.form
                key="signin"
                onSubmit={submitSignIn}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <LogoMark className="h-8 w-auto" />
                <h1 className="mt-5 text-xl font-semibold tracking-tight">
                  Welcome back, {owner.name.split(" ")[0]}
                </h1>
                <p className="mt-1 truncate text-sm text-ink-dim">
                  {owner.email}
                </p>
                <div className="relative mt-5">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="password"
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Password"
                    className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent/50"
                  />
                </div>
                {error && <p className="mt-2.5 text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  Unlock workspace
                  <ArrowRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("recovery");
                    setError(null);
                  }}
                  className="mt-3 w-full text-center text-xs text-ink-faint transition hover:text-ink"
                >
                  Forgot your password? Use your recovery code
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="recovery"
                onSubmit={submitRecovery}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <KeyRound className="size-8 text-accent" />
                <h1 className="mt-4 text-xl font-semibold tracking-tight">
                  Reset with your recovery code
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                  Enter the code you saved when the workspace was created (or
                  from your latest backup file), then pick a new password.
                </p>
                <div className="mt-5 space-y-3">
                  <input
                    autoFocus
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError(null);
                    }}
                    placeholder="FRNK-XXXX-XXXX-XXXX"
                    className={`${inputCls} font-mono tracking-wider`}
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="New password (8+ characters)"
                    className={inputCls}
                  />
                </div>
                {error && <p className="mt-2.5 text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  Reset password
                  <ArrowRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="mt-3 w-full text-center text-xs text-ink-faint transition hover:text-ink"
                >
                  Back to sign in
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Workspace data stays on this browser — the lock keeps passers-by
          out, not attackers.
        </p>
      </div>
    </div>
  );
}
