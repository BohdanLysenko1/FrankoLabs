"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { vaultFor, type VaultItem } from "@/lib/portal/portal";
import { Card, PageHeader, SectionLabel } from "./ui";

function CredentialRow({ item }: { item: VaultItem }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setShown(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <KeyRound className="size-4 shrink-0 text-ink-faint" />
      <div className="min-w-0 flex-1">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-medium hover:text-accent"
        >
          {item.name}
        </a>
        <p className="truncate text-xs text-ink-faint">
          {item.username} · {item.category}
        </p>
      </div>
      <code className="rounded-md border border-edge bg-surface-3 px-2.5 py-1 font-mono text-xs tabular-nums">
        {shown ? item.secret : "••••••••••••"}
      </code>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setShown(!shown)}
          aria-label={shown ? "Hide password" : "Reveal password"}
          className="rounded-lg p-2 text-ink-dim transition hover:bg-surface-3 hover:text-ink"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          onClick={copy}
          aria-label="Copy password"
          className={`rounded-lg p-2 transition hover:bg-surface-3 ${
            copied ? "text-accent" : "text-ink-dim hover:text-ink"
          }`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
      <p className="w-full text-right text-[10px] text-ink-faint sm:w-auto">
        accessed {item.lastAccessDaysAgo}d ago
      </p>
    </div>
  );
}

export default function VaultView() {
  const { state } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <PageHeader
        title="Password vault"
        subtitle="Client credentials, stored like they matter — encrypted, scoped per client, every access logged."
      />

      {clients.map((c) => (
        <div key={c.id}>
          <SectionLabel>{c.name}</SectionLabel>
          <Card className="mt-3 divide-y divide-edge">
            {vaultFor(c).map((item) => (
              <CredentialRow key={`${c.id}-${item.id}`} item={item} />
            ))}
          </Card>
        </div>
      ))}

      <Card className="flex items-start gap-3.5 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
        <p className="text-sm leading-relaxed text-ink-dim">
          Demo fixtures for now — real credentials get end-to-end encryption
          before storage, per-credential sharing, and one-click revocation when
          a teammate or project rolls off. Clients see their own slice in the
          portal&apos;s Vault tool.
        </p>
      </Card>
    </div>
  );
}
