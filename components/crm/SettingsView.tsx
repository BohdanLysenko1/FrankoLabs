"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CreditCard,
  Download,
  Kanban,
  KeyRound,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { useCrm } from "@/lib/crm/store";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/session";
import {
  buildBackup,
  downloadBackup,
  getLastBackupAt,
  parseBackup,
  readLegacyLocalWorkspace,
  type WorkspaceBackup,
} from "@/lib/backup";
import {
  fmtMoney,
  type AutomationAction,
  type AutomationTrigger,
  type CrmState,
  type PlanId,
  type Stage,
  type TeamRole,
} from "@/lib/crm/types";
import {
  Avatar,
  Card,
  Field,
  GhostButton,
  PageHeader,
  PrimaryButton,
  SectionLabel,
  inputCls,
} from "./ui";

const tabs = [
  { id: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { id: "pipeline", label: "Pipeline", icon: Kanban },
  { id: "automations", label: "Automations", icon: Zap },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

const plans: {
  id: PlanId;
  name: string;
  price: number;
  blurb: string;
  features: string[];
}[] = [
  {
    id: "solo",
    name: "Solo",
    price: 29,
    blurb: "One seat, full CRM.",
    features: ["1 seat", "Unlimited contacts & deals", "Pulse monitoring", "Client portal (3 clients)"],
  },
  {
    id: "studio",
    name: "Studio",
    price: 79,
    blurb: "For small teams running client work.",
    features: ["5 seats", "Everything in Solo", "Unlimited client portals", "Custom pipeline stages"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 199,
    blurb: "Full Franko OS integration.",
    features: ["Unlimited seats", "Everything in Studio", "API access", "Priority support"],
  },
];

function WorkspaceTab() {
  const { state, actions } = useCrm();
  const [name, setName] = useState(state.workspace.name);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionLabel>Workspace name</SectionLabel>
        <p className="mt-1.5 text-sm text-ink-dim">
          Shown across the CRM and in your client portals.
        </p>
        <div className="mt-4 flex max-w-md gap-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            className={inputCls}
          />
          <PrimaryButton
            onClick={() => {
              actions.setWorkspaceName(name.trim() || state.workspace.name);
              setSaved(true);
            }}
          >
            {saved ? <Check className="size-4" /> : "Save"}
          </PrimaryButton>
        </div>
      </Card>

      <AccountCard />
      <BackupCard />

      <Card className="p-6">
        <SectionLabel>Reset workspace</SectionLabel>
        <p className="mt-1.5 max-w-lg text-base leading-relaxed text-ink-dim">
          Replace everything with the original sample dataset. Your owner
          account and client passwords are kept — export a backup first if you
          might want today&apos;s data back.
        </p>
        <GhostButton
          className="mt-4"
          onClick={() => {
            if (
              window.confirm(
                "Replace all workspace data with the sample dataset? This can't be undone without a backup.",
              )
            ) {
              actions.resetDemo();
            }
          }}
        >
          <RotateCcw className="size-4" />
          Restore sample data
        </GhostButton>
      </Card>
    </div>
  );
}

function AccountCard() {
  const { mode } = useCrm();
  const session = useSession();
  const [displayName, setDisplayName] = useState(session.profile?.name ?? "");
  const [nameSaved, setNameSaved] = useState(false);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (mode === "demo") {
    return (
      <Card className="p-6">
        <SectionLabel>Account &amp; security</SectionLabel>
        <p className="mt-1.5 max-w-lg text-base leading-relaxed text-ink-dim">
          This is the local demo — nothing here is tied to an account. Create
          a real workspace from the sign-in screen and everything syncs to the
          cloud with proper authentication.
        </p>
      </Card>
    );
  }

  const saveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    });
    if (err) {
      setError(err.message);
      return;
    }
    await session.refresh();
    setNameSaved(true);
  };

  const changePassword = async () => {
    if (next.length < 8) {
      setError("New password needs at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: next });
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setDone(true);
    setNext("");
    setConfirm("");
  };

  return (
    <Card className="p-6">
      <SectionLabel>Account &amp; security</SectionLabel>
      <p className="mt-1.5 text-sm text-ink-dim">
        Signed in as <span className="text-ink">{session.profile?.name}</span>{" "}
        · {session.profile?.email}. Forgot-password emails go there.
      </p>
      <div className="mt-4 flex max-w-md gap-2">
        <input
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setNameSaved(false);
          }}
          placeholder="Display name"
          className={inputCls}
        />
        <PrimaryButton onClick={saveName}>
          {nameSaved ? <Check className="size-4" /> : "Save"}
        </PrimaryButton>
      </div>
      <div className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            setError(null);
            setDone(false);
          }}
          placeholder="New password"
          className={inputCls}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError(null);
            setDone(false);
          }}
          placeholder="Confirm password"
          className={inputCls}
        />
        <PrimaryButton onClick={changePassword}>
          {done ? <Check className="size-4" /> : <KeyRound className="size-4" />}
          {done ? "Changed" : "Change"}
        </PrimaryButton>
      </div>
      {error && <p className="mt-2.5 text-sm text-red-400">{error}</p>}
    </Card>
  );
}

function BackupCard() {
  const { state, actions, mode } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState(() => getLastBackupAt());
  const [pending, setPending] = useState<WorkspaceBackup | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);
  // The one-time migration path: data from the old localStorage-only app.
  const [legacy, setLegacy] = useState(() =>
    typeof window === "undefined" ? null : readLegacyLocalWorkspace(),
  );

  const exportNow = () => {
    const backup = buildBackup(state);
    downloadBackup(backup);
    setLastBackup(backup.exportedAt);
  };

  const pickFile = async (file: File | undefined) => {
    setImportError(null);
    setImported(false);
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (!backup) {
      setImportError("That file isn't a Franko workspace backup.");
      return;
    }
    setPending(backup);
  };

  const confirmImport = async () => {
    if (!pending || importing) return;
    setImporting(true);
    try {
      await actions.importState(pending.state);
      setPending(null);
      setImported(true);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed — try again.",
      );
    } finally {
      setImporting(false);
    }
  };

  const importLegacy = async () => {
    if (!legacy || importing) return;
    if (
      !window.confirm(
        "Add the workspace saved in this browser to your cloud workspace? Existing records stay; the local data is copied in.",
      )
    ) {
      return;
    }
    setImporting(true);
    try {
      await actions.importState(legacy);
      setLegacy(null);
      setImported(true);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed — try again.",
      );
    } finally {
      setImporting(false);
    }
  };

  const counts = (s: Partial<CrmState>) =>
    [
      `${s.companies?.length ?? 0} companies`,
      `${s.deals?.length ?? 0} deals`,
      `${s.invoices?.length ?? 0} invoices`,
      `${s.tickets?.length ?? 0} tickets`,
    ].join(" · ");

  return (
    <Card className="p-6">
      <SectionLabel>Data &amp; backup</SectionLabel>
      <p className="mt-1.5 max-w-lg text-base leading-relaxed text-ink-dim">
        {mode === "db"
          ? "Your workspace lives in the cloud database. Download a JSON backup any time; importing a backup adds its records to this workspace."
          : "This demo lives in the browser. Download a JSON backup to keep the data or import it into a real workspace later."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={exportNow}>
          <Download className="size-4" />
          Download backup
        </PrimaryButton>
        <GhostButton onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          Import backup
        </GhostButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="text-xs text-ink-faint">
          {lastBackup
            ? `Last backup ${new Date(lastBackup).toLocaleString()}`
            : "No backup taken yet"}
        </span>
      </div>

      {mode === "db" && legacy && (
        <div className="mt-4 max-w-lg rounded-xl border border-accent/30 bg-accent-dim/30 p-4">
          <p className="text-sm font-medium">
            Found a workspace saved in this browser
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
            “{legacy.workspace?.name ?? "My workspace"}” — {counts(legacy)}.
            From before this app moved to the cloud. Import it once and it
            follows you to every device.
          </p>
          <div className="mt-3 flex gap-2">
            <PrimaryButton onClick={importLegacy} disabled={importing}>
              {importing ? "Importing…" : "Import into this workspace"}
            </PrimaryButton>
            <GhostButton onClick={() => setLegacy(null)}>Dismiss</GhostButton>
          </div>
        </div>
      )}

      {importError && (
        <p className="mt-3 text-sm text-red-400">{importError}</p>
      )}
      {imported && (
        <p className="mt-3 text-sm text-accent">
          Workspace data imported.
        </p>
      )}

      {pending && (
        <div className="mt-4 max-w-lg rounded-xl border border-edge bg-surface-2/60 p-4">
          <p className="text-sm font-medium">
            Import “{pending.workspaceName}” into this workspace?
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-dim">
            Backup from {new Date(pending.exportedAt).toLocaleString()} —{" "}
            {counts(pending.state)}. Its records (and its pipeline stages) are
            added to your current workspace ({counts(state)}).
          </p>
          <div className="mt-3 flex gap-2">
            <PrimaryButton onClick={confirmImport} disabled={importing}>
              {importing ? "Importing…" : "Import backup"}
            </PrimaryButton>
            <GhostButton onClick={() => setPending(null)}>Cancel</GhostButton>
          </div>
        </div>
      )}
    </Card>
  );
}

function PipelineTab() {
  const { state, actions } = useCrm();
  const [newStage, setNewStage] = useState("");
  const open = state.stages.filter((s) => s.kind === "open");
  const closed = state.stages.filter((s) => s.kind !== "open");

  const add = () => {
    if (!newStage.trim()) return;
    actions.addStage(newStage.trim());
    setNewStage("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionLabel>Working stages</SectionLabel>
        <p className="mt-1.5 text-sm text-ink-dim">
          Rename, reorder or remove the open columns of your board. Deals in a
          removed stage move to the first remaining one.
        </p>
        <div className="mt-4 space-y-2">
          {open.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-xl border border-edge bg-surface-2/50 p-2.5"
            >
              <span className="w-6 text-center font-mono text-xs text-ink-faint">
                {i + 1}
              </span>
              <input
                value={s.name}
                onChange={(e) => actions.renameStage(s.id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none transition focus:border-accent/50 focus:bg-surface-2"
              />
              <button
                onClick={() => actions.moveStage(s.id, -1)}
                disabled={i === 0}
                aria-label={`Move ${s.name} up`}
                className="rounded-lg p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                onClick={() => actions.moveStage(s.id, 1)}
                disabled={i === open.length - 1}
                aria-label={`Move ${s.name} down`}
                className="rounded-lg p-1.5 text-ink-faint transition hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                onClick={() => actions.removeStage(s.id)}
                disabled={open.length <= 1}
                aria-label={`Remove ${s.name}`}
                className="rounded-lg p-1.5 text-ink-faint transition hover:text-danger disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex max-w-md gap-2">
          <input
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a stage…"
            className={inputCls}
          />
          <PrimaryButton onClick={add}>
            <Plus className="size-4" />
          </PrimaryButton>
        </div>
      </Card>

      <Card className="p-6">
        <SectionLabel>Closing stages</SectionLabel>
        <p className="mt-1.5 text-sm text-ink-dim">
          Every pipeline ends in Won or Lost — these are fixed so reporting
          stays consistent.
        </p>
        <div className="mt-3 flex gap-2">
          {closed.map((s) => (
            <span
              key={s.id}
              className="rounded-full border border-edge px-3 py-1.5 text-sm text-ink-dim"
            >
              {s.name}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function describeTrigger(t: AutomationTrigger, stages: Stage[]): string {
  if (t.type === "deal-created") return "When a deal is created";
  if (t.type === "deal-won") return "When a deal is won";
  if (t.type === "contract-signed") return "When a contract is signed";
  if (t.type === "ticket-opened") return "When a support ticket is opened";
  if (t.type === "invoice-paid") return "When an invoice is paid";
  const stage = stages.find((s) => s.id === t.stageId);
  return `When a deal enters ${stage?.name ?? "a stage"}`;
}

function describeAction(a: AutomationAction): string {
  if (a.type === "create-task")
    return `create task “${a.title}” due in ${a.offsetDays}d`;
  if (a.type === "portal-update") return `post portal update “${a.text}”`;
  return `schedule ${a.kind} “${a.title}” in ${a.offsetDays}d`;
}

function AutomationsTab() {
  const { state, actions } = useCrm();
  const openStages = state.stages.filter((s) => s.kind === "open");
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("deal-created");
  const [actionType, setActionType] = useState("create-task");
  const [text, setText] = useState("");
  const [offset, setOffset] = useState("3");

  const addRule = () => {
    if (!name.trim() || !text.trim()) return;
    const parsedTrigger: AutomationTrigger =
      trigger === "deal-created"
        ? { type: "deal-created" }
        : trigger === "deal-won"
          ? { type: "deal-won" }
          : trigger === "contract-signed"
            ? { type: "contract-signed" }
            : trigger === "ticket-opened"
              ? { type: "ticket-opened" }
              : trigger === "invoice-paid"
                ? { type: "invoice-paid" }
                : { type: "stage-enter", stageId: trigger.replace("stage:", "") };
    const parsedAction: AutomationAction =
      actionType === "create-task"
        ? { type: "create-task", title: text.trim(), offsetDays: Number(offset) }
        : actionType === "portal-update"
          ? { type: "portal-update", text: text.trim() }
          : {
              type: "create-event",
              title: text.trim(),
              offsetDays: Number(offset),
              kind: "call",
            };
    actions.addRule({
      name: name.trim(),
      enabled: true,
      trigger: parsedTrigger,
      action: parsedAction,
    });
    setName("");
    setText("");
  };

  return (
    <div className="space-y-6">
      <Card className="divide-y divide-edge">
        <p className="p-4 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Active rules — these run on deals, contracts, tickets and invoices
        </p>
        {state.rules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-4 p-4">
            <button
              role="switch"
              aria-checked={rule.enabled}
              aria-label={`Toggle ${rule.name}`}
              onClick={() => actions.toggleRule(rule.id)}
              className={`relative h-5.5 w-10 shrink-0 rounded-full transition ${
                rule.enabled ? "bg-accent" : "bg-surface-3"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4.5 rounded-full bg-white transition-all ${
                  rule.enabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${rule.enabled ? "" : "text-ink-faint"}`}
              >
                {rule.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-faint">
                {describeTrigger(rule.trigger, state.stages)} →{" "}
                {describeAction(rule.action)}
              </p>
            </div>
            <button
              onClick={() => actions.deleteRule(rule.id)}
              aria-label={`Delete ${rule.name}`}
              className="shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {state.rules.length === 0 && (
          <p className="p-5 text-sm text-ink-faint">
            No rules yet — add your first below.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <SectionLabel>New rule</SectionLabel>
        <div className="mt-4 space-y-3">
          <Field label="Rule name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Follow up after proposal"
              className={inputCls}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="When">
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className={inputCls}
              >
                <option value="deal-created">A deal is created</option>
                {openStages.map((s) => (
                  <option key={s.id} value={`stage:${s.id}`}>
                    A deal enters {s.name}
                  </option>
                ))}
                <option value="deal-won">A deal is won</option>
                <option value="contract-signed">A contract is signed</option>
                <option value="ticket-opened">A support ticket is opened</option>
                <option value="invoice-paid">An invoice is paid</option>
              </select>
            </Field>
            <Field label="Then">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className={inputCls}
              >
                <option value="create-task">Create a task</option>
                <option value="portal-update">Post a client-portal update</option>
                <option value="create-event">Schedule a call</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <Field
              label={actionType === "portal-update" ? "Update text" : "Title"}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  actionType === "portal-update"
                    ? "Project kicked off: {deal}"
                    : "Follow up on proposal — {deal}"
                }
                className={inputCls}
              />
            </Field>
            {actionType !== "portal-update" && (
              <Field label="Due in">
                <select
                  value={offset}
                  onChange={(e) => setOffset(e.target.value)}
                  className={inputCls}
                >
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="7">1 week</option>
                </select>
              </Field>
            )}
          </div>
          <p className="text-xs text-ink-faint">
            Tip: <code className="font-mono">{"{deal}"}</code> expands to the
            deal name when the rule runs.
          </p>
          <PrimaryButton onClick={addRule}>
            <Plus className="size-4" />
            Add rule
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function TeamTab() {
  const { state, actions, mode } = useCrm();
  const session = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Member");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invite = async () => {
    if (!name.trim() || !email.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSent(null);
    const result = await actions.addTeamMember(name.trim(), email.trim(), role);
    setBusy(false);
    if (result.ok) {
      setSent(
        mode === "db"
          ? `Invite sent to ${email.trim()} — they'll set a password and land in this workspace.`
          : `${name.trim()} added.`,
      );
      setName("");
      setEmail("");
    } else {
      setError(result.error ?? "Invite failed.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="divide-y divide-edge">
        {state.team.map((m) => {
          const isSelf = m.id === session.profile?.id;
          return (
            <div key={m.id} className="flex items-center gap-3.5 p-4">
              <Avatar name={m.name} hue={m.hue} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name}
                  {isSelf && (
                    <span className="ml-2 text-xs text-ink-faint">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-faint">{m.email}</p>
              </div>
              <span className="rounded-full border border-edge px-2.5 py-1 text-xs text-ink-dim">
                {m.role}
              </span>
              {m.role !== "Owner" && !isSelf && (
                <button
                  onClick={() => actions.removeTeamMember(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="rounded-lg p-1.5 text-ink-faint transition hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          );
        })}
      </Card>

      <Card className="p-6">
        <SectionLabel>Invite a teammate</SectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="alex@frankolabs.com"
              className={inputCls}
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className={inputCls}
            >
              <option>Member</option>
              <option>Admin</option>
            </select>
          </Field>
        </div>
        <PrimaryButton className="mt-4" onClick={invite} disabled={busy}>
          <Plus className="size-4" />
          {busy ? "Sending…" : "Send invite"}
        </PrimaryButton>
        {sent && <p className="mt-2 text-xs text-accent">{sent}</p>}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <p className="mt-2 text-xs text-ink-faint">
          {mode === "db"
            ? "Invites email a sign-up link; the account gets this workspace with the role you pick."
            : "Demo mode — invites add the member instantly, no email is sent."}
        </p>
      </Card>
    </div>
  );
}

function BillingTab() {
  const { state, actions } = useCrm();

  const invoices = [
    { id: "FL-2091", label: "Franko CRM — Studio, June", amount: 79 },
    { id: "FL-2064", label: "Franko CRM — Studio, May", amount: 79 },
    { id: "FL-2038", label: "Franko CRM — Studio, April", amount: 79 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-3">
        {plans.map((p) => {
          const current = state.workspace.plan === p.id;
          return (
            <Card
              key={p.id}
              className={`p-6 ${current ? "border-accent/50 bg-accent-dim/40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-semibold">{p.name}</p>
                {current && (
                  <span className="rounded-full border border-accent/40 bg-accent-dim px-2 py-0.5 text-[11px] font-medium text-accent">
                    current plan
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                ${p.price}
                <span className="text-sm font-normal text-ink-faint">/mo</span>
              </p>
              <p className="mt-1 text-xs text-ink-faint">{p.blurb}</p>
              <ul className="mt-4 space-y-1.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-ink-dim"
                  >
                    <Check className="size-3.5 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              {!current && (
                <GhostButton
                  className="mt-5 w-full justify-center"
                  onClick={() => actions.setPlan(p.id)}
                >
                  Switch to {p.name}
                </GhostButton>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="divide-y divide-edge">
        <p className="p-4 text-[11px] font-medium uppercase tracking-widest text-ink-dim">
          Invoice history
        </p>
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3.5 p-4">
            <CreditCard className="size-4 shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{inv.id}</p>
              <p className="truncate text-xs text-ink-faint">{inv.label}</p>
            </div>
            <span className="font-mono text-sm tabular-nums text-ink-dim">
              {fmtMoney(inv.amount)}
            </span>
            <span className="text-[11px] font-medium text-accent">paid</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function SettingsView() {
  const [tab, setTab] = useState<TabId>("workspace");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <PageHeader
        title="Settings"
        subtitle="Workspace, pipeline, team and billing."
      />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-edge bg-surface-2/65 p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                tab === t.id
                  ? "bg-surface-3 font-medium text-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "workspace" && <WorkspaceTab />}
      {tab === "pipeline" && <PipelineTab />}
      {tab === "automations" && <AutomationsTab />}
      {tab === "team" && <TeamTab />}
      {tab === "billing" && <BillingTab />}
    </div>
  );
}
