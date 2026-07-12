"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Eye,
  KeyRound,
  LockKeyhole,
  Mail,
  MailCheck,
  UserRound,
} from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/session";
import { playSound } from "@/lib/sound";
import { inputCls } from "./ui";

/**
 * The /crm door when nobody is signed in: sign in to an existing workspace,
 * create an account (workspace setup follows after the email confirm), or
 * request a password reset. The demo link opens a seeded, throwaway session.
 */
export default function OwnerLock() {
  const session = useSession();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: typeof mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setBusy(false);
      if (err) {
        setError("That email and password don't match.");
        setPassword("");
        return;
      }
      playSound("open");
      await session.refresh();
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setBusy(false);
        setError("Add your name.");
        return;
      }
      if (password.length < 8) {
        setBusy(false);
        setError("Password needs at least 8 characters.");
        return;
      }
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/crm`,
        },
      });
      setBusy(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        // Email confirmation disabled — straight through to onboarding.
        playSound("open");
        await session.refresh();
      } else {
        setNotice(
          `Almost there — we sent a confirmation link to ${email}. Open it and you'll land back here to set up your workspace.`,
        );
      }
      return;
    }

    // Password reset.
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/set-password`,
    });
    setBusy(false);
    if (err) setError(err.message);
    else setNotice("Reset link sent — check your inbox.");
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-desktop p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-2xl shadow-black/50">
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={submit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <LogoMark className="h-8 w-auto" />
              <h1 className="mt-5 text-xl font-semibold tracking-tight">
                {mode === "signin"
                  ? "Sign in to your workspace"
                  : mode === "signup"
                    ? "Create your workspace"
                    : "Reset your password"}
              </h1>
              <p className="mt-1 text-sm text-ink-dim">
                {mode === "signin"
                  ? "Your CRM, synced and live from anywhere."
                  : mode === "signup"
                    ? "One account runs the whole OS — CRM, portal, billing."
                    : "We'll email you a link to pick a new password."}
              </p>

              <div className="mt-5 space-y-3">
                {mode === "signup" && (
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                      placeholder="Your name"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="email"
                    autoFocus={mode !== "signup"}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Email"
                    className={`${inputCls} pl-10`}
                  />
                </div>
                {mode !== "reset" && (
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder={
                        mode === "signup"
                          ? "Create a password (8+ characters)"
                          : "Password"
                      }
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                )}
              </div>

              {error && <p className="mt-2.5 text-sm text-red-400">{error}</p>}
              {notice && (
                <p className="mt-2.5 flex items-start gap-2 text-sm leading-relaxed text-accent">
                  <MailCheck className="mt-0.5 size-4 shrink-0" />
                  {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
              >
                {mode === "signin"
                  ? "Unlock workspace"
                  : mode === "signup"
                    ? "Create account"
                    : "Email me a reset link"}
                <ArrowRight className="size-4" />
              </button>

              {mode === "signin" ? (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="mt-3 w-full text-center text-xs text-ink-dim transition hover:text-ink"
                  >
                    New here? Create your workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 text-center text-xs text-ink-faint transition hover:text-ink"
                  >
                    <KeyRound className="size-3" />
                    Forgot your password?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="mt-3 w-full text-center text-xs text-ink-faint transition hover:text-ink"
                >
                  Back to sign in
                </button>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
          <Eye className="size-3" />
          Just looking?{" "}
          {/* Full page load on purpose — the demo flag is read at boot. */}
          <a
            href="/crm?noonboard=1"
            className="text-ink-dim underline transition hover:text-ink"
          >
            Explore the demo workspace
          </a>
        </p>
      </div>
    </div>
  );
}
