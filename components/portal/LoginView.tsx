"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  LockKeyhole,
  Mail,
  MailCheck,
  Sparkles,
} from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
import { initials } from "@/lib/crm/types";
import { usePortalAuth } from "@/lib/portal/auth";
import { primaryContactFor } from "@/lib/portal/portal";
import { useSession } from "@/lib/supabase/session";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";

/**
 * The portal sign-in screen. Real clients sign in with the email+password
 * from their invite; the tiles below open one-click demo portals from the
 * seeded store so visitors can feel the product without an account.
 */
export default function LoginView() {
  const router = useRouter();
  const session = useSession();
  const { state, mode } = useCrm();
  const { ready, company: signedIn, signIn, requestReset, previewAs } =
    usePortalAuth();
  const demoClients = mode === "demo" ? state.companies.filter((c) => c.isClient) : [];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const retro = useTheme() === "xp";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    if (resetMode) {
      const err = await requestReset(email);
      setBusy(false);
      if (err) setError(err);
      else setNotice("Reset link sent — check your inbox.");
      return;
    }
    const err = await signIn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      setPassword("");
    } else {
      playSound("open");
      router.push("/");
    }
  };

  const openDemo = (companyId: string) => {
    playSound("open");
    previewAs(companyId);
    router.push("/");
  };

  if (!ready) return null;

  // Agency member landed here — their door is the CRM.
  if (session.user && session.membership && !signedIn) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-14 text-center">
        <LogoMark className="h-8 w-auto" />
        <div>
          <p className="text-lg font-semibold tracking-tight">
            You&apos;re signed in as the {state.workspace.name} team
          </p>
          <p className="mt-1 text-sm text-ink-dim">
            Client portals live here; your workspace is the CRM. You can also
            preview any client&apos;s portal from the CRM&apos;s Portal view.
          </p>
        </div>
        <Link
          href="/crm"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
        >
          Open Franko CRM
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="flex flex-col items-center gap-5 px-6 py-14 text-center">
        <LogoMark className="h-8 w-auto" />
        <div>
          <p className="text-lg font-semibold tracking-tight">
            You&apos;re signed in as {signedIn.name}
          </p>
          <p className="mt-1 text-sm text-ink-dim">
            Your desktop is ready with everything on your plan.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
        >
          Open my desktop
          <ArrowRight className="size-4" />
        </button>
      </div>
    );
  }

  const signInForm = (
    <form onSubmit={submit} className="space-y-3">
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="Email"
          className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-accent/50"
        />
      </div>
      {!resetMode && (
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Password"
            className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-accent/50"
          />
        </div>
      )}
      {error && <p className="text-center text-sm text-red-400">{error}</p>}
      {notice && (
        <p className="flex items-center justify-center gap-2 text-center text-sm text-accent">
          <MailCheck className="size-4" />
          {notice}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {resetMode ? "Email me a reset link" : "Sign in"}
        <ArrowRight className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          setResetMode(!resetMode);
          setError(null);
          setNotice(null);
        }}
        className="w-full text-center text-xs text-ink-faint transition hover:text-ink"
      >
        {resetMode ? "Back to sign in" : "Forgot your password?"}
      </button>
    </form>
  );

  const demoTiles = demoClients.length > 0 && (
    <div className="mt-8">
      <p className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
        <Sparkles className="size-3.5" />
        Or explore a demo portal
      </p>
      <div className="mt-3 space-y-2">
        {demoClients.map((c) => {
          const contact = primaryContactFor(state, c.id);
          return (
            <button
              key={c.id}
              onClick={() => openDemo(c.id)}
              className="flex w-full items-center gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-3.5 text-left transition hover:border-edge-strong hover:bg-surface-2"
            >
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  background: `hsl(${contact?.hue ?? 160} 45% 24%)`,
                  color: `hsl(${contact?.hue ?? 160} 70% 78%)`,
                }}
              >
                {initials(contact?.name ?? c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  {c.name}
                </span>
                <span className="block truncate text-xs text-ink-dim">
                  {contact ? `${contact.name} · ${contact.email}` : c.domain}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-ink-dim">
                <Eye className="size-3" />
                Demo
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Retro theme: the XP "Welcome" screen — logo left, sign-in right.
  if (retro) {
    return (
      <div className="flex min-h-full flex-col bg-gradient-to-b from-[#7d8f4b] via-[#68793c] to-[#55632e] text-white">
        <div className="grid flex-1 items-center gap-8 px-8 py-10 md:grid-cols-[1fr_auto_1.2fr]">
          <div className="flex flex-col items-center gap-3 text-center md:items-end md:text-right">
            <LogoMark className="h-14 w-auto drop-shadow-lg" />
            <p className="text-3xl font-bold tracking-tight drop-shadow">
              Franko<span className="font-light"> OS</span>
            </p>
            <p className="max-w-52 text-sm text-white/85">
              To begin, sign in to your workspace
            </p>
          </div>

          <div className="hidden h-full w-px bg-gradient-to-b from-transparent via-white/60 to-transparent md:block" />

          <div className="w-full max-w-md justify-self-center rounded-md bg-white/10 p-5 shadow-inner md:justify-self-start">
            <form onSubmit={submit} className="space-y-2">
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Email"
                className="w-full rounded-sm border border-[#4c5828] bg-white px-2.5 py-1.5 text-sm text-ink outline-none"
              />
              {!resetMode && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Password"
                  className="w-full rounded-sm border border-[#4c5828] bg-white px-2.5 py-1.5 text-sm text-ink outline-none"
                />
              )}
              {error && (
                <p className="text-xs font-semibold text-[#ffd9d9]">{error}</p>
              )}
              {notice && (
                <p className="text-xs font-semibold text-white">{notice}</p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-white/60 bg-gradient-to-b from-[#8fbf57] to-[#528527] px-3 py-1.5 text-sm font-bold shadow"
              >
                {resetMode ? "Email reset link" : "Sign in"}
                <ArrowRight className="size-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => setResetMode(!resetMode)}
                className="w-full text-center text-xs text-white/80 underline"
              >
                {resetMode ? "Back to sign in" : "Forgot your password?"}
              </button>
            </form>
            {demoClients.length > 0 && (
              <div className="mt-4 border-t border-white/25 pt-3">
                <p className="text-xs font-semibold text-white/85">
                  Or click a demo workspace:
                </p>
                <div className="mt-1.5 space-y-1">
                  {demoClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openDemo(c.id)}
                      className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition hover:bg-white/10"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-white/80 text-xs font-bold shadow">
                        {initials(c.name)}
                      </span>
                      <span className="truncate text-sm font-bold drop-shadow">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/25 bg-[#4c5828]/60 px-6 py-3 text-xs text-white/80">
          <span>Portals are invite-only.</span>
          <span>
            Not a client yet?{" "}
            <a href="/contact" className="font-semibold underline">
              Book a consultation
            </a>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <div className="mb-8 text-center">
        <LogoMark className="mx-auto h-8 w-auto" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Client sign in
        </h1>
        <p className="mt-1 text-sm text-ink-dim">
          {resetMode
            ? "We'll email you a link to reset your password."
            : "Sign in with the account from your invite email."}
        </p>
      </div>

      {signInForm}
      {demoTiles}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-dim">
        Portals are invite-only and included with every active plan.
        <br />
        Not a client yet?{" "}
        <a href="/contact" className="text-accent hover:underline">
          Book a consultation
        </a>
        .
      </p>
    </div>
  );
}
