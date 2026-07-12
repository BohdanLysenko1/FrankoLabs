"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Database, Sparkles } from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
import { useSession } from "@/lib/supabase/session";
import { playSound } from "@/lib/sound";
import { inputCls } from "./ui";

type Template = "agency" | "simple";

const templates: {
  id: Template;
  name: string;
  stages: string[];
  blurb: string;
}[] = [
  {
    id: "agency",
    name: "Standard agency",
    stages: ["New", "Contacted", "Qualified", "Proposal sent", "Negotiation"],
    blurb: "The full sales motion — best if deals involve proposals and back-and-forth.",
  },
  {
    id: "simple",
    name: "Simple",
    stages: ["Lead", "In talks"],
    blurb: "Two working columns plus Won/Lost. Less to maintain, faster to scan.",
  },
];

/**
 * Workspace setup, shown to a signed-in account with no workspace yet.
 * (Account creation happens on the sign-in screen; this only runs after.)
 */
export default function Onboarding() {
  const { actions } = useCrm();
  const session = useSession();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<Template>("agency");
  const [sampleData, setSampleData] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitName = (e?: FormEvent) => {
    e?.preventDefault();
    playSound("tap");
    setStep(1);
  };

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await actions.completeOnboarding(
        name.trim() || "My workspace",
        template,
        sampleData,
      );
      playSound("open");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-desktop p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i <= step ? "w-8 bg-accent" : "w-4 bg-surface-3"
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-2xl shadow-black/50">
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.form
                key="name"
                onSubmit={submitName}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <LogoMark className="h-8 w-auto" />
                <h1 className="mt-5 text-xl font-semibold tracking-tight">
                  Welcome
                  {session.profile ? `, ${session.profile.name.split(" ")[0]}` : ""} —
                  name your workspace
                </h1>
                <p className="mt-2 text-base leading-relaxed text-ink-dim">
                  Usually your studio or company name. It shows up in the
                  sidebar and on everything clients see.
                </p>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Franko Labs"
                  className={`${inputCls} mt-5`}
                />
                <button
                  type="submit"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </button>
              </motion.form>
            ) : step === 1 ? (
              <motion.div
                key="template"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-semibold tracking-tight">
                  Pick your pipeline
                </h1>
                <p className="mt-2 text-base leading-relaxed text-ink-dim">
                  How deals move from first contact to won. You can rename,
                  add and reorder stages later in Settings.
                </p>
                <div className="mt-5 space-y-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTemplate(t.id);
                        playSound("tap");
                      }}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        template === t.id
                          ? "border-accent/50 bg-accent-dim"
                          : "border-edge bg-surface-2/60 hover:border-edge-strong"
                      }`}
                    >
                      <p className="flex items-center justify-between text-[15px] font-medium">
                        {t.name}
                        {template === t.id && (
                          <Check className="size-4 text-accent" />
                        )}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                        {t.blurb}
                      </p>
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        {[...t.stages, "Won", "Lost"].map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-ink-dim"
                          >
                            {s}
                          </span>
                        ))}
                      </p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-semibold tracking-tight">
                  Start with sample data?
                </h1>
                <p className="mt-2 text-base leading-relaxed text-ink-dim">
                  A realistic agency dataset — companies, deals, invoices,
                  client portals — so every screen has something to show. You
                  can wipe it any time from the account menu.
                </p>
                <div className="mt-5 space-y-3">
                  <button
                    onClick={() => {
                      setSampleData(true);
                      playSound("tap");
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      sampleData
                        ? "border-accent/50 bg-accent-dim"
                        : "border-edge bg-surface-2/60 hover:border-edge-strong"
                    }`}
                  >
                    <Sparkles className="mt-0.5 size-4.5 shrink-0 text-accent" />
                    <span>
                      <span className="block text-[15px] font-medium">
                        Yes, load the sample workspace
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-dim">
                        Recommended — the fastest way to see how it all fits.
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSampleData(false);
                      playSound("tap");
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      !sampleData
                        ? "border-accent/50 bg-accent-dim"
                        : "border-edge bg-surface-2/60 hover:border-edge-strong"
                    }`}
                  >
                    <Database className="mt-0.5 size-4.5 shrink-0 text-ink-dim" />
                    <span>
                      <span className="block text-[15px] font-medium">
                        No, start empty
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-dim">
                        A clean slate — bring your own contacts and deals.
                      </span>
                    </span>
                  </button>
                </div>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <button
                  onClick={create}
                  disabled={busy}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy ? "Setting up your workspace…" : "Open my workspace"}
                  <ArrowRight className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Signed in as {session.profile?.email ?? "you"} — your workspace syncs
          to the cloud and works from any device.
        </p>
      </div>
    </div>
  );
}
