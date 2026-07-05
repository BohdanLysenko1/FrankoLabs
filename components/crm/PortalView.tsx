"use client";

import { useState } from "react";
import {
  Check,
  ExternalLink,
  Link2,
  MailPlus,
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
 * at the main site — this screen previews it as them and hands out invite
 * links (the invite email, once sending is real).
 */
export default function PortalView() {
  const { state } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);
  const prospects = state.companies.filter((c) => !c.isClient);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
            const entitled = entitlementsFor(c);
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
                      <p className="truncate text-[15px] font-medium">{c.name}</p>
                      <p className="truncate text-xs text-ink-faint">
                        {contact
                          ? `${contact.name} · ${contact.email}`
                          : c.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {PORTAL_TOOLS.map((t) => {
                    const on = entitled.includes(t.id);
                    return (
                      <span
                        key={t.id}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                          on
                            ? "border-accent/30 bg-accent-dim text-accent"
                            : "border-edge text-ink-faint line-through"
                        }`}
                      >
                        <t.icon className="size-3" />
                        {t.name}
                      </span>
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
