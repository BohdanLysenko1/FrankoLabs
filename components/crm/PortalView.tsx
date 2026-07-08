"use client";

import { useState } from "react";
import {
  Check,
  ExternalLink,
  KeyRound,
  Link2,
  MailPlus,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { clearClientCredential, useAccounts } from "@/lib/accounts";
import { initials } from "@/lib/crm/types";
import {
  PORTAL_TOOLS,
  entitlementsFor,
  primaryContactFor,
} from "@/lib/portal/portal";
import { Card, SectionLabel } from "./ui";

/**
 * Agency-side portal management. Every client company gets a real portal
 * at the main site — this screen previews it as them and hands out invite
 * links (the invite email, once sending is real).
 */
export default function PortalView() {
  const { state, actions } = useCrm();
  const { clients: credentials } = useAccounts();
  const clients = state.companies.filter((c) => c.isClient);
  const prospects = state.companies.filter((c) => !c.isClient);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleTool = (companyId: string, entitled: string[], toolId: string) => {
    const next = entitled.includes(toolId)
      ? entitled.filter((id) => id !== toolId)
      : [...entitled, toolId];
    actions.setEntitlements(companyId, next);
  };

  const copyInvite = async (companyId: string) => {
    const link = `${window.location.origin}/login?invite=${companyId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(companyId);
      setTimeout(() => setCopiedId((id) => (id === companyId ? null : id)), 2000);
    } catch {
      // Clipboard blocked — surface the link instead.
      window.prompt("Invite link:", link);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Client portal</h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-dim">
          Every client signs in at the main site and gets their own desktop —
          projects, invoices and support, fed live by this CRM. Preview any
          portal or send an invite link.
        </p>
      </div>

      <div>
        <SectionLabel>Active portals</SectionLabel>
        <div className="mt-3 space-y-3">
          {clients.map((c) => {
            const contact = primaryContactFor(state, c.id);
            const entitled = entitlementsFor(state, c);
            const activated = Boolean(credentials[c.id]);
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
                            activated
                              ? "The client set their password and can sign in"
                              : "Waiting for the client to open their invite link"
                          }
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            activated
                              ? "border-accent/30 bg-accent-dim text-accent"
                              : "border-edge text-ink-faint"
                          }`}
                        >
                          {activated ? "Active" : "Invited"}
                        </span>
                      </p>
                      <p className="truncate text-xs text-ink-faint">
                        {contact
                          ? `${contact.name} · ${contact.email}`
                          : c.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {activated && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Reset ${c.name}'s portal access? Their current password stops working and the invite link will ask them to set a new one.`,
                            )
                          ) {
                            clearClientCredential(c.id);
                          }
                        }}
                        title="Revoke their password — the invite link sets a new one"
                        className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
                      >
                        <KeyRound className="size-3.5" />
                        Reset access
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
                    <button
                      onClick={() => copyInvite(c.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                        copiedId === c.id
                          ? "border-accent/50 bg-accent-dim text-accent"
                          : "border-edge bg-surface-2 text-ink-dim hover:border-edge-strong hover:text-ink"
                      }`}
                    >
                      {copiedId === c.id ? (
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
                  </div>
                </div>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-widest text-ink-faint">
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
          <p className="text-sm leading-relaxed text-ink-dim">
            {`${prospects.length} ${prospects.length === 1 ? "company" : "companies"}`}{" "}
            in the pipeline {prospects.length === 1 ? "isn't a client" : "aren't clients"}{" "}
            yet — win the deal and their portal switches on from here.
          </p>
        </Card>
      )}
    </div>
  );
}
