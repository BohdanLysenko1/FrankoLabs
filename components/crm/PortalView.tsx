"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  ExternalLink,
  KeyRound,
  Link2,
  MailPlus,
  Send,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { initials } from "@/lib/crm/types";
import {
  PORTAL_TOOLS,
  entitlementsFor,
  primaryContactFor,
} from "@/lib/portal/portal";
import { Card, SectionLabel } from "./ui";

/**
 * Agency-side portal management. Every client company gets a real portal
 * at the main site — this screen previews it as them, sends invite emails
 * and decides which tools each client sees.
 */

function InviteControls({ companyId }: { companyId: string }) {
  const { state, actions, mode } = useCrm();
  const contact = primaryContactFor(state, companyId);
  const [email, setEmail] = useState(contact?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Demo mode has no email — hand out the preview link instead.
  if (mode === "demo") {
    const copyInvite = async () => {
      const link = `${window.location.origin}/login?invite=${companyId}`;
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.prompt("Invite link:", link);
      }
    };
    return (
      <button
        onClick={copyInvite}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
          copied
            ? "border-accent/50 bg-accent-dim text-accent"
            : "border-edge bg-surface-2 text-ink-dim hover:border-edge-strong hover:text-ink"
        }`}
      >
        {copied ? (
          <>
            <Check className="size-3.5" />
            Copied
          </>
        ) : (
          <>
            <Link2 className="size-3.5" />
            Copy invite link
          </>
        )}
      </button>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !email.includes("@")) return;
    setBusy(true);
    setError(null);
    const result = await actions.inviteClient(companyId, email, contact?.name);
    setBusy(false);
    if (result.ok) {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } else {
      setError(result.error ?? "Invite failed.");
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        placeholder="client@company.com"
        title={error ?? undefined}
        className={`w-44 rounded-lg border bg-surface-2 px-3 py-1.5 text-xs outline-none transition focus:border-accent/50 ${
          error ? "border-red-500/60" : "border-edge"
        }`}
      />
      <button
        type="submit"
        disabled={busy}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition disabled:opacity-60 ${
          sent
            ? "border-accent/50 bg-accent-dim text-accent"
            : "border-edge bg-surface-2 text-ink-dim hover:border-edge-strong hover:text-ink"
        }`}
      >
        {sent ? (
          <>
            <Check className="size-3.5" />
            Invite sent
          </>
        ) : (
          <>
            <Send className="size-3.5" />
            {busy ? "Sending…" : "Email invite"}
          </>
        )}
      </button>
    </form>
  );
}

export default function PortalView() {
  const { state, actions, mode } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);
  const prospects = state.companies.filter((c) => !c.isClient);

  const toggleTool = (companyId: string, entitled: string[], toolId: string) => {
    const next = entitled.includes(toolId)
      ? entitled.filter((id) => id !== toolId)
      : [...entitled, toolId];
    actions.setEntitlements(companyId, next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Client portal</h1>
        <p className="mt-1 max-w-xl text-base leading-relaxed text-ink-dim">
          Every client signs in at the main site and gets their own desktop —
          projects, invoices and support, fed live by this CRM. Preview any
          portal or invite the client by email.
        </p>
      </div>

      <div>
        <SectionLabel>Active portals</SectionLabel>
        <div className="mt-3 space-y-3">
          {clients.map((c) => {
            const contact = primaryContactFor(state, c.id);
            const entitled = entitlementsFor(state, c);
            const portalUsers = state.clientUsers.filter(
              (u) => u.companyId === c.id,
            );
            const activated = portalUsers.length > 0;
            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        background: `hsl(${contact?.hue ?? 160} 45% 24%)`,
                        color: `hsl(${contact?.hue ?? 160} 70% 78%)`,
                      }}
                    >
                      {initials(contact?.name ?? c.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-[15px] font-medium">
                        {c.name}
                        <span
                          title={
                            mode === "demo"
                              ? "Demo portal — one click opens it from the sign-in screen"
                              : activated
                                ? `Signed-in access: ${portalUsers.map((u) => u.email).join(", ")}`
                                : "No portal account yet — send an email invite"
                          }
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            mode === "demo" || activated
                              ? "border-accent/30 bg-accent-dim text-accent"
                              : "border-edge text-ink-faint"
                          }`}
                        >
                          {mode === "demo"
                            ? "Demo"
                            : activated
                              ? "Active"
                              : "Not invited"}
                        </span>
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        {activated
                          ? portalUsers.map((u) => u.email).join(", ")
                          : contact
                            ? `${contact.name} · ${contact.email}`
                            : c.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {mode === "db" && activated && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Revoke ${c.name}'s portal access? Their account keeps existing, but it loses access to this portal until you invite them again.`,
                            )
                          ) {
                            void actions.revokeClientAccess(c.id);
                          }
                        }}
                        title="Remove this company's portal users"
                        className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
                      >
                        <KeyRound className="size-3.5" />
                        Revoke access
                      </button>
                    )}
                    <a
                      href={`/?portal-as=${c.id}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
                    >
                      <ExternalLink className="size-3.5" />
                      Preview portal
                    </a>
                    <InviteControls companyId={c.id} />
                  </div>
                </div>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
                  Tools in their portal — click to toggle
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {PORTAL_TOOLS.map((t) => {
                    const on = entitled.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTool(c.id, entitled, t.id)}
                        title={
                          on
                            ? `Remove ${t.name} from ${c.name}'s portal`
                            : `Add ${t.name} to ${c.name}'s portal`
                        }
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                          on
                            ? "border-accent/30 bg-accent-dim text-accent hover:border-accent/60"
                            : "border-edge text-ink-faint line-through hover:border-edge-strong hover:text-ink-dim"
                        }`}
                      >
                        <t.icon className="size-3" />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
          {clients.length === 0 && (
            <Card className="p-6 text-sm text-ink-faint">
              No client companies yet. Mark a company as a client to open
              their portal.
            </Card>
          )}
        </div>
      </div>

      {prospects.length > 0 && (
        <Card className="flex items-start gap-3.5 p-5">
          <MailPlus className="mt-0.5 size-5 shrink-0 text-ink-faint" strokeWidth={1.75} />
          <p className="text-base leading-relaxed text-ink-dim">
            {`${prospects.length} ${prospects.length === 1 ? "company" : "companies"}`}{" "}
            in the pipeline {prospects.length === 1 ? "isn't a client" : "aren't clients"}{" "}
            yet — win the deal and their portal switches on from here.
          </p>
        </Card>
      )}
    </div>
  );
}
