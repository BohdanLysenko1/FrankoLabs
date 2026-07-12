"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FilePen,
  KeyRound,
  Send,
  Sparkles,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import {
  daysAgo,
  fmtDate,
  fmtMoney,
  relTime,
  type Company,
  type Contract,
  type DocArticle,
  type VaultEntry,
} from "@/lib/crm/types";
import { contractsFor, primaryContactFor, vaultFor } from "@/lib/portal/portal";
import { answer, suggestionsFor } from "@/lib/assistant";
import { playSound } from "@/lib/sound";
import { ToolHeader } from "./tools";

/* ------------------------------------------------------------------ */
/* Contracts — review and sign                                         */
/* ------------------------------------------------------------------ */

const contractStatusLabel: Record<Contract["status"], string> = {
  sent: "awaiting your signature",
  viewed: "awaiting your signature",
  signed: "signed",
};

function ContractCard({
  contract,
  defaultSigner,
}: {
  contract: Contract;
  defaultSigner: string;
}) {
  const { actions } = useCrm();
  const [open, setOpen] = useState(contract.status !== "signed");
  const [name, setName] = useState(defaultSigner);
  const [justSigned, setJustSigned] = useState(false);
  const unsigned = contract.status !== "signed";

  // Opening an unsigned agreement is what flips "sent" → "viewed" for the
  // agency — the same signal a real e-sign provider would send.
  useEffect(() => {
    if (open && contract.status === "sent") {
      actions.markContractViewed(contract.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sign = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.signContract(contract.id, name.trim());
    playSound("open");
    setJustSigned(true);
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        unsigned ? "border-accent/40 bg-accent-dim/40" : "border-edge bg-surface-2/60"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3.5 p-5 text-left"
      >
        <FilePen
          className={`size-5 shrink-0 ${unsigned ? "text-accent" : "text-ink-faint"}`}
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">{contract.title}</p>
          <p className="mt-0.5 text-xs text-ink-dim">
            {fmtMoney(contract.amount)} · sent {fmtDate(contract.sentAt)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            unsigned
              ? "border-accent/50 text-accent"
              : "border-edge text-ink-faint"
          }`}
        >
          {contract.status === "signed" ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3" /> signed
            </span>
          ) : (
            contractStatusLabel[contract.status]
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-edge p-5">
          <p className="text-base leading-relaxed text-ink-dim">
            {contract.summary}
          </p>
          <ul className="space-y-2">
            {contract.terms.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-ink-dim">
                <Check className="mt-0.5 size-3.5 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>

          {contract.status === "signed" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-surface-2/60 p-4">
              <p className="text-sm text-ink-dim">
                Signed by{" "}
                <span className="font-medium text-ink">{contract.signedBy}</span>
                {contract.signedAt ? ` on ${fmtDate(contract.signedAt)}` : ""} —
                on file.
              </p>
              <button
                onClick={() => playSound("tap")}
                className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-3 py-1.5 text-xs text-ink-dim transition hover:border-edge-strong hover:text-ink"
              >
                <Download className="size-3.5" />
                Download PDF
              </button>
            </div>
          ) : justSigned ? (
            <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-dim p-4">
              <CheckCircle2 className="size-5 shrink-0 text-accent" />
              <p className="text-sm">
                Signed. The deposit invoice is in Billing and kickoff is on the
                team&apos;s board — that&apos;s &quot;signed means
                started&quot;.
              </p>
            </div>
          ) : (
            <form
              onSubmit={sign}
              className="rounded-xl border border-edge bg-surface/90 p-4"
            >
              <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
                Sign electronically
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Type your full legal name"
                  className="min-w-0 flex-1 rounded-xl border border-edge bg-surface-2 px-4 py-2.5 font-serif text-base italic outline-none transition focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sign agreement
                </button>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-ink-faint">
                Typing your name and signing constitutes a legally binding
                e-signature (demo — nothing is binding yet). Signing invoices
                the 50% deposit automatically.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function ContractsTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const contact = primaryContactFor(state, company.id);
  const contracts = contractsFor(state, company.id);
  const pending = contracts.filter((c) => c.status !== "signed");
  const signed = contracts.filter((c) => c.status === "signed");

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      <ToolHeader
        title="Contracts"
        subtitle="Proposals and agreements — review, sign and download, all in one place."
      />

      {pending.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
            Waiting on you
          </p>
          <div className="mt-3 space-y-3">
            {pending.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                defaultSigner={contact?.name ?? ""}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          On file
        </p>
        <div className="mt-3 space-y-3">
          {signed.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              defaultSigner={contact?.name ?? ""}
            />
          ))}
          {signed.length === 0 && (
            <p className="rounded-xl border border-edge bg-surface-2/60 p-5 text-sm text-ink-faint">
              Signed agreements will live here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guides — published knowledge base                                   */
/* ------------------------------------------------------------------ */

export function GuidesTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const guides = state.docs.filter((d) => d.clientVisible);
  const [active, setActive] = useState<DocArticle | null>(null);

  if (active) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
        <button
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          All guides
        </button>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            {active.category}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {active.title}
          </h1>
          <p className="mt-1 text-xs text-ink-dim">
            {active.minutes} min read · updated {daysAgo(active.updatedAt)}d ago
          </p>
        </div>
        <div className="space-y-5">
          {active.sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <h2 className="mb-2 text-[15px] font-medium">{s.heading}</h2>
              )}
              <p className="text-base leading-relaxed text-ink-dim">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <ToolHeader
        title="Guides"
        subtitle={`Answers written for ${company.name} — how your site, billing and support work.`}
      />
      <div className="space-y-3">
        {guides.map((g) => (
          <button
            key={g.slug}
            onClick={() => {
              playSound("tap");
              setActive(g);
            }}
            className="flex w-full items-start gap-3.5 rounded-xl border border-edge bg-surface-2/60 p-5 text-left transition hover:border-edge-strong hover:bg-surface-3/60"
          >
            <BookOpen className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium">{g.title}</p>
              <p className="mt-1 text-base leading-relaxed text-ink-dim">
                {g.summary}
              </p>
              <p className="mt-2 text-xs text-ink-dim">
                {g.category} · {g.minutes} min read
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vault — credentials shared with the client                          */
/* ------------------------------------------------------------------ */

function VaultRow({ item }: { item: VaultEntry }) {
  const { actions } = useCrm();
  const [secret, setSecret] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetched (and access-logged) on demand — never sits in the page data.
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
      // Clipboard blocked — revealing is still available.
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
        <p className="truncate text-xs text-ink-dim">{item.username}</p>
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
      </div>
      <p className="w-full text-right text-[11px] text-ink-dim sm:w-auto">
        {item.lastAccessAt
          ? `accessed ${relTime(item.lastAccessAt)}`
          : "never accessed"}
      </p>
    </div>
  );
}

export function VaultTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const items = vaultFor(state, company.id);
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <ToolHeader
        title="Password vault"
        subtitle="Credentials the team manages for you — encrypted, scoped, and logged."
      />
      <div className="divide-y divide-edge rounded-xl border border-edge bg-surface-2/60">
        {items.map((v) => (
          <VaultRow key={v.id} item={v} />
        ))}
        {items.length === 0 && (
          <p className="p-5 text-sm text-ink-faint">
            No credentials shared with you yet.
          </p>
        )}
      </div>
      <p className="rounded-xl border border-edge bg-surface-2/60 p-5 text-base leading-relaxed text-ink-dim">
        Everything here is encrypted before it&apos;s stored, shared only
        between you and the team, and every reveal is logged. Need another
        credential added or someone&apos;s access revoked? One support message
        does it.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assistant — scripted chat over live data                            */
/* ------------------------------------------------------------------ */

type ChatMessage = { role: "user" | "assistant"; text: string };

export function AssistantChat({
  greeting,
  scope,
}: {
  greeting: string;
  scope: Parameters<typeof answer>[1];
}) {
  const { state } = useCrm();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    playSound("tap");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    // A beat of "thinking" keeps the scripted engine from feeling instant-fake.
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: answer(state, scope, q) }]);
      setThinking(false);
    }, 550);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="os-scroll min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl border p-3.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto border-accent/30 bg-accent-dim"
                : "border-edge bg-surface-2/60"
            }`}
          >
            {m.text}
          </div>
        ))}
        {thinking && (
          <div className="flex w-fit items-center gap-1.5 rounded-2xl border border-edge bg-surface-2/60 px-4 py-3">
            <span className="size-1.5 animate-pulse rounded-full bg-ink-faint" />
            <span className="size-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-ink-faint [animation-delay:300ms]" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-3 border-t border-edge p-4">
        <div className="flex flex-wrap gap-2">
          {suggestionsFor(scope).map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-edge bg-surface-2/60 px-3 py-1.5 text-xs text-ink-dim transition hover:border-accent/50 hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your workspace…"
            className="min-w-0 flex-1 rounded-xl border border-edge bg-surface-2 px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send message"
            className="rounded-xl bg-accent px-4 py-2.5 text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
        <p className="text-center text-[11px] text-ink-dim">
          Scripted demo — answers are computed live from your workspace data.
        </p>
      </div>
    </div>
  );
}

export function AssistantTool({ company }: { company: Company }) {
  const { state } = useCrm();
  const contact = primaryContactFor(state, company.id);
  const first = contact ? contact.name.split(" ")[0] : company.name;
  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex items-center gap-3 border-b border-edge p-5">
        <Sparkles className="size-6 text-accent" strokeWidth={1.75} />
        <div>
          <h1 className="text-base font-semibold tracking-tight">Assistant</h1>
          <p className="text-xs text-ink-dim">
            Knows your projects, invoices, site and contracts
          </p>
        </div>
      </div>
      <AssistantChat
        scope={{ kind: "client", company }}
        greeting={`Hi ${first} — I can see everything in your workspace: projects, invoices, contracts, your site's health. What would you like to know?`}
      />
    </div>
  );
}
