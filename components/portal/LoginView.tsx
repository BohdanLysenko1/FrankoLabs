"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, MailCheck } from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
import { initials, type Company } from "@/lib/crm/types";
import { usePortalAuth } from "@/lib/portal/auth";
import { primaryContactFor } from "@/lib/portal/portal";
import { playSound } from "@/lib/sound";

/**
 * The portal sign-in screen, styled like an OS user picker. Accounts are
 * invite-only — the tiles are the CRM's client companies. Demo mode: any
 * password unlocks a tile.
 */
export default function LoginView() {
  const router = useRouter();
  const { state } = useCrm();
  const { ready, company: signedIn, signIn, signOut } = usePortalAuth();
  const clients = state.companies.filter((c) => c.isClient);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [invited, setInvited] = useState<Company | null>(null);

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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (signIn(selectedId)) {
      playSound("open");
      router.push("/");
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
              onClick={() => {
                setSelectedId(selected ? null : c.id);
                playSound("tap");
              }}
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

      {selectedId && (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-edge bg-surface-2 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-accent/50"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
          >
            Sign in
            <ArrowRight className="size-4" />
          </button>
          <p className="text-center text-xs text-ink-faint">
            Demo mode — any password works.
          </p>
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
