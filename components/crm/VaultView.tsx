"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import {
  relTime,
  type VaultCategory,
  type VaultEntry,
} from "@/lib/crm/types";
import { Card, Field, PageHeader, PrimaryButton, SectionLabel, inputCls } from "./ui";

const CATEGORIES: VaultCategory[] = [
  "hosting",
  "domain",
  "marketing",
  "analytics",
];

function CredentialRow({ item }: { item: VaultEntry }) {
  const { actions } = useCrm();
  const [secret, setSecret] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Secrets stay encrypted at rest — fetched (and access-logged) on demand.
  const fetchSecret = async (): Promise<string> => {
    if (secret !== null) return secret;
    const value = await actions.revealVaultSecret(item.id);
    setSecret(value);
    return value;
  };

  const toggleShown = async () => {
    if (!shown) await fetchSecret();
    setShown(!shown);
  };

  const copy = async () => {
    const value = await fetchSecret();
    try {
      await navigator.clipboard.writeText(value);
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
        {shown && secret !== null ? secret || "(empty)" : "••••••••••••"}
      </code>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => void toggleShown()}
          aria-label={shown ? "Hide password" : "Reveal password"}
          className="rounded-lg p-2 text-ink-dim transition hover:bg-surface-3 hover:text-ink"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          onClick={() => void copy()}
          aria-label="Copy password"
          className={`rounded-lg p-2 transition hover:bg-surface-3 ${
            copied ? "text-accent" : "text-ink-dim hover:text-ink"
          }`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${item.name}" from the vault?`)) {
              actions.deleteVaultItem(item.id);
            }
          }}
          aria-label={`Delete ${item.name}`}
          className="rounded-lg p-2 text-ink-faint transition hover:bg-surface-3 hover:text-danger"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="w-full text-right text-[11px] text-ink-dim sm:w-auto">
        {item.lastAccessAt ? `accessed ${relTime(item.lastAccessAt)}` : "never accessed"}
      </p>
    </div>
  );
}

function AddCredential() {
  const { state, actions } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [category, setCategory] = useState<VaultCategory>("hosting");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.saveVaultItem({
      companyId: companyId || null,
      name: name.trim(),
      category,
      username: username.trim(),
      url: url.trim(),
      secret: secret || undefined,
    });
    setName("");
    setUsername("");
    setUrl("");
    setSecret("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="p-6">
      <SectionLabel>Add a credential</SectionLabel>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cloudflare dashboard"
              className={inputCls}
            />
          </Field>
          <Field label="Shared with">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className={inputCls}
            >
              <option value="">Internal only</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (shows in their portal)
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VaultCategory)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@client.com"
              className={inputCls}
            />
          </Field>
          <Field label="URL">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Secret">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Encrypted before it touches the database"
            className={inputCls}
          />
        </Field>
        <PrimaryButton type="submit">
          {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
          {saved ? "Saved" : "Save to vault"}
        </PrimaryButton>
      </form>
    </Card>
  );
}

export default function VaultView() {
  const { state, mode } = useCrm();
  const clients = state.companies.filter((c) => c.isClient);
  const internal = state.vault.filter((v) => v.companyId === null);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-16 md:p-8">
      <PageHeader
        title="Password vault"
        subtitle="Credentials stored like they matter — encrypted at rest, scoped per client, every access logged."
      />

      {internal.length > 0 && (
        <div>
          <SectionLabel>Internal</SectionLabel>
          <Card className="mt-3 divide-y divide-edge">
            {internal.map((item) => (
              <CredentialRow key={item.id} item={item} />
            ))}
          </Card>
        </div>
      )}

      {clients.map((c) => {
        const items = state.vault.filter((v) => v.companyId === c.id);
        if (items.length === 0) return null;
        return (
          <div key={c.id}>
            <SectionLabel>{c.name}</SectionLabel>
            <Card className="mt-3 divide-y divide-edge">
              {items.map((item) => (
                <CredentialRow key={item.id} item={item} />
              ))}
            </Card>
          </div>
        );
      })}

      <AddCredential />

      <Card className="flex items-start gap-3.5 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
        <p className="text-base leading-relaxed text-ink-dim">
          {mode === "db"
            ? "Secrets are encrypted server-side (the key never leaves the vault) and only decrypted when you reveal or copy them — each access updates the audit timestamp. Items shared with a client appear in their portal's Vault tool."
            : "Demo mode keeps sample secrets in memory only. Sign in to a real workspace and secrets are encrypted server-side before storage."}
        </p>
      </Card>
    </div>
  );
}
