"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  ExternalLink,
  KeyRound,
  Link2,
  MailPlus,
  Send,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { pendingClientInvites } from "@/lib/actions/invites";
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

  // Portal users who haven't accepted their invite yet (auth-side truth,
  // fetched server-side). Refreshes whenever the member list changes —
  // sending an invite inserts a company_member, so the chip flips live.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const clientUserKey = useMemo(
    () => state.clientUsers.map((u) => u.userId).sort().join(","),
    [state.clientUsers],
  );
  const workspaceId = state.workspace.id;
  useEffect(() => {
    if (mode !== "db" || !workspaceId) return;
    let cancelled = false;
    void pendingClientInvites(workspaceId).then((result) => {
      if (!cancelled && result.ok) setPendingIds(new Set(result.pending));
    });
    return () => {
      cancelled = true;
    };
  }, [mode, workspaceId, clientUserKey]);

  const toggleTool = (companyId: string, entitled: string[], toolId: string) => {
    const next = entitled.includes(toolId)
      ? entitled.filter((id) => id !== toolId)
      : [...entitled, toolId];
    actions.setEntitlements(companyId, next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 max-w-xl text-base leading-relaxed text-ink-dim">
          Create portal accounts and choose the tools each client gets. Every
          client signs in at the main site and lands on their own desktop —
          projects, invoices and support, fed live by this CRM.
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
            const activated =
              portalUsers.length > 0 &&
              portalUsers.some((u) => !pendingIds.has(u.userId));
            const invitePending = portalUsers.length > 0 && !activated;
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
                                : invitePending
                                  ? `Invite sent — waiting for ${portalUsers.map((u) => u.email).join(", ")} to set a password`
                                  : "No portal account yet — send an email invite"
                          }
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            mode === "demo" || activated
                              ? "border-accent/30 bg-accent-dim text-accent"
                              : invitePending
                                ? "border-warn/40 text-warn"
                                : "border-edge text-ink-faint"
                          }`}
                        >
                          {mode === "demo"
                            ? "Demo"
                            : activated
                              ? "Active"
                              : invitePending
                                ? "Invited"
                                : "Not invited"}
                        </span>
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        {portalUsers.length > 0
                          ? portalUsers.map((u) => u.email).join(", ")
                          : contact
                            ? `${contact.name} · ${contact.email}`
                            : c.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {mode === "db" && portalUsers.length > 0 && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              invitePending
                                ? `Cancel ${c.name}'s pending invite? The link they received stops granting portal access.`
                                : `Revoke ${c.name}'s portal access? Their account keeps existing, but it loses access to this portal until you invite them again.`,
                            )
                          ) {
                            void actions.revokeClientAccess(c.id);
                          }
                        }}
                        title="Remove this company's portal users"
                        className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
                      >
                        <KeyRound className="size-3.5" />
                        {invitePending ? "Cancel invite" : "Revoke access"}
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
        <div>
          <SectionLabel>Not clients yet</SectionLabel>
          <Card className="mt-3 divide-y divide-edge">
            {prospects.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {c.industry || c.domain || "In the pipeline"}
                  </p>
                </div>
                <button
                  onClick={() => actions.updateCompany(c.id, { isClient: true })}
                  title={`Turn on ${c.name}'s portal — you can invite them right after`}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
                >
                  <MailPlus className="size-3.5" />
                  Make client
                </button>
              </div>
            ))}
          </Card>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Making a company a client switches on their portal so you can send
            the invite and pick their tools above. Winning a deal does this
            automatically.
          </p>
        </div>
      )}
    </div>
  );
}
