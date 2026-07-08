"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LockKeyhole, MailCheck } from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
import { initials, type Company } from "@/lib/crm/types";
import { usePortalAuth } from "@/lib/portal/auth";
import { primaryContactFor } from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";

/**
 * The portal sign-in screen, styled like an OS user picker. Accounts are
 * invite-only — the tiles are the CRM's client companies. An invite link
 * activates an account by letting the client set their password; after
 * that, the tile requires the real password.
 */
export default function LoginView() {
  const router = useRouter();
  const { state } = useCrm();
  const {
    ready,
    company: signedIn,
    isActivated,
    signIn,
    activate,
    signOut,
  } = usePortalAuth();
  const clients = state.companies.filter((c) => c.isClient);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [invited, setInvited] = useState<Company | null>(null);
  const retro = useTheme() === "xp";

  // /login?invite=<companyId> is the link a client receives — preselect them.
  useEffect(() => {
    const inviteId = new URLSearchParams(window.location.search).get("invite");
    const match = inviteId
      ? clients.find((c) => c.id === inviteId)
      : undefined;
    if (match) {
      setInvited(match);
      setSelectedId(match.id);
    }
    // Runs once; clients from the seeded store are stable by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
    setPassword("");
    setConfirm("");
    setError(null);
    playSound("tap");
  };

  // A selected tile is in one of three modes: sign in with the real
  // password, set a password (arrived via their invite link), or waiting
  // for an invite (no password set, no link).
  const mode = !selectedId
    ? null
    : isActivated(selectedId)
      ? ("signin" as const)
      : invited?.id === selectedId
        ? ("activate" as const)
        : ("waiting" as const);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || busy) return;
    if (mode === "activate") {
      if (password.length < 8) {
        setError("Password needs at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords don't match.");
        return;
      }
    }
    setBusy(true);
    const ok =
      mode === "activate"
        ? await activate(selectedId, password)
        : await signIn(selectedId, password);
    setBusy(false);
    if (ok) {
      playSound("open");
      router.push("/");
    } else {
      setError(
        mode === "activate"
          ? "Couldn't activate this account — try again."
          : "That password isn't right.",
      );
      setPassword("");
    }
  };

  if (!ready) return null;

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
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
          >
            Open my desktop
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={signOut}
            className="rounded-xl border border-edge bg-surface-2 px-5 py-2.5 text-sm text-ink-dim transition hover:border-edge-strong hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Retro theme: the XP "Welcome" screen — logo left, workspace tiles right.
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
              To begin, click your workspace name
            </p>
            {invited && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-sm bg-white/15 px-3 py-1.5 text-xs font-semibold">
                <MailCheck className="size-3.5" />
                You&apos;ve been invited to the {invited.name} portal
              </p>
            )}
          </div>

          <div className="hidden h-full w-px bg-gradient-to-b from-transparent via-white/60 to-transparent md:block" />

          <div className="flex w-full max-w-md flex-col gap-1.5 justify-self-center md:justify-self-start">
            {clients.map((c) => {
              const contact = primaryContactFor(state, c.id);
              const selected = selectedId === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-md transition ${
                    selected ? "bg-white/20 shadow-inner" : "hover:bg-white/10"
                  }`}
                >
                  <button
                    onClick={() => select(c.id)}
                    className="flex w-full items-center gap-3.5 p-2.5 text-left"
                  >
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-white/80 text-sm font-bold shadow"
                      style={{
                        background: `hsl(${contact?.hue ?? 160} 45% 30%)`,
                        color: `hsl(${contact?.hue ?? 160} 70% 82%)`,
                      }}
                    >
                      {initials(contact?.name ?? c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-bold leading-tight drop-shadow">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-white/75">
                        {contact
                          ? `${contact.name} · ${contact.email}`
                          : c.domain}
                      </span>
                    </span>
                  </button>
                  {selected && mode === "waiting" && (
                    <p className="px-2.5 pb-2.5 pl-[4.75rem] text-xs text-white/80">
                      This portal isn&apos;t activated yet — open your invite
                      link to set a password.
                    </p>
                  )}
                  {selected && mode !== "waiting" && (
                    <form
                      onSubmit={submit}
                      className="space-y-1.5 px-2.5 pb-2.5 pl-[4.75rem]"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          autoFocus
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError(null);
                          }}
                          placeholder={
                            mode === "activate"
                              ? "Create a password (8+ characters)"
                              : "Type your password"
                          }
                          className="w-full max-w-56 rounded-sm border border-[#4c5828] bg-white px-2.5 py-1.5 text-sm text-ink outline-none"
                        />
                        {mode === "signin" && (
                          <button
                            type="submit"
                            disabled={busy}
                            aria-label="Sign in"
                            className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-white/60 bg-gradient-to-b from-[#8fbf57] to-[#528527] shadow"
                          >
                            <ArrowRight className="size-4" strokeWidth={3} />
                          </button>
                        )}
                      </div>
                      {mode === "activate" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={confirm}
                            onChange={(e) => {
                              setConfirm(e.target.value);
                              setError(null);
                            }}
                            placeholder="Confirm password"
                            className="w-full max-w-56 rounded-sm border border-[#4c5828] bg-white px-2.5 py-1.5 text-sm text-ink outline-none"
                          />
                          <button
                            type="submit"
                            disabled={busy}
                            aria-label="Set password and sign in"
                            className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-white/60 bg-gradient-to-b from-[#8fbf57] to-[#528527] shadow"
                          >
                            <ArrowRight className="size-4" strokeWidth={3} />
                          </button>
                        </div>
                      )}
                      {error && (
                        <p className="text-xs font-semibold text-[#ffd9d9]">
                          {error}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              );
            })}
            {clients.length === 0 && (
              <p className="rounded-md bg-white/10 p-5 text-center text-sm text-white/80">
                No client accounts yet — portals are created when a project
                kicks off.
              </p>
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
          Pick your workspace to unlock your desktop.
        </p>
        {invited && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-dim px-3.5 py-1.5 text-xs font-medium text-accent">
            <MailCheck className="size-3.5" />
            You&apos;ve been invited to the {invited.name} portal
          </p>
        )}
      </div>

      <div className="space-y-2">
        {clients.map((c) => {
          const contact = primaryContactFor(state, c.id);
          const selected = selectedId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => select(c.id)}
              className={`flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition ${
                selected
                  ? "border-accent/50 bg-accent-dim"
                  : "border-edge bg-surface-2/60 hover:border-edge-strong hover:bg-surface-2"
              }`}
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
                <span className="block truncate text-xs text-ink-faint">
                  {contact ? `${contact.name} · ${contact.email}` : c.domain}
                </span>
              </span>
              <span
                className={`size-2 shrink-0 rounded-full ${
                  selected ? "bg-accent" : "bg-surface-3"
                }`}
              />
            </button>
          );
        })}
        {clients.length === 0 && (
          <p className="rounded-xl border border-edge bg-surface-2/60 p-5 text-center text-sm text-ink-faint">
            No client accounts yet — portals are created when a project
            kicks off.
          </p>
        )}
      </div>

      {mode === "waiting" && (
        <p className="mt-5 rounded-xl border border-edge bg-surface-2/60 p-4 text-center text-sm leading-relaxed text-ink-dim">
          This portal isn&apos;t activated yet. Open the invite link you
          received to set your password — or ask your contact at{" "}
          {state.workspace.name} to send a new one.
        </p>
      )}

      {(mode === "signin" || mode === "activate") && (
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "activate" && (
            <p className="flex items-center justify-center gap-2 text-xs font-medium text-accent">
              <KeyRound className="size-3.5" />
              First sign-in — create your password
            </p>
          )}
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder={
                mode === "activate"
                  ? "Create a password (8+ characters)"
                  : "Password"
              }
              className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent/50"
            />
          </div>
          {mode === "activate" && (
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError(null);
                }}
                placeholder="Confirm password"
                className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent/50"
              />
            </div>
          )}
          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
          >
            {mode === "activate" ? "Set password & sign in" : "Sign in"}
            <ArrowRight className="size-4" />
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
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
