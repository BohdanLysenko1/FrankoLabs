"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/session";

/**
 * Where invite and password-reset links land once the auth session is open:
 * pick a password, then continue to the CRM (team) or the portal desktop
 * (clients).
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const session = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [claimingHash, setClaimingHash] = useState(() =>
    typeof window !== "undefined" && window.location.hash.includes("access_token"),
  );

  // Admin-sent invite links can't use PKCE (no code verifier exists in this
  // browser), so Supabase's verify endpoint hands the session over as URL
  // fragment tokens. The server callback never sees fragments — claim them
  // here instead.
  useEffect(() => {
    if (!claimingHash) return;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const supabase = createClient();
        const { error: err } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (!err) {
          window.history.replaceState(null, "", window.location.pathname);
          await session.refresh();
        }
      }
      setClaimingHash(false);
    }, 0);
    return () => clearTimeout(timer);
    // Runs once for the fragment this page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setBusy(false);
      setError(updateError.message);
      return;
    }
    await session.refresh();
    router.replace(session.membership ? "/crm" : "/");
  };

  if (session.ready && !session.user && !claimingHash) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <LogoMark className="mx-auto h-8 w-auto" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          This link has expired
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-dim">
          Open the most recent invite or reset email — or ask for a new one
          from the sign-in screen.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <LogoMark className="mx-auto h-8 w-auto" />
      <h1 className="mt-5 text-center text-xl font-semibold tracking-tight">
        Set your password
      </h1>
      <p className="mt-1 text-center text-sm text-ink-dim">
        {session.profile?.email ?? "Your account"} — pick a password to finish
        setting up.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="New password (8+ characters)"
            className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-accent/50"
          />
        </div>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
          <input
            type="password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError(null);
            }}
            placeholder="Confirm password"
            className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-accent/50"
          />
        </div>
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
        >
          Save password & continue
          <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  );
}
