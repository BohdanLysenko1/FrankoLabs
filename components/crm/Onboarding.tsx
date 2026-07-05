"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Database, Sparkles } from "lucide-react";
import LogoMark from "@/components/os/LogoMark";
import { useCrm } from "@/lib/crm/store";
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

export default function Onboarding() {
  const { actions } = useCrm();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<Template>("agency");
  const [sampleData, setSampleData] = useState(true);

  const finish = () =>
    actions.completeOnboarding(name.trim() || "My workspace", template, sampleData);

  return (
    <div className="flex h-dvh items-center justify-center bg-desktop p-4">
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
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <LogoMark className="h-10 w-auto" />
                <h1 className="mt-5 text-2xl font-semibold tracking-tight">
                  Welcome to Franko CRM
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-dim">
                  The relationship module of Franko OS — pipeline, contacts,
                  tasks and a client portal, with Pulse watching your deals so
                  nothing goes cold. Let&apos;s set up your workspace; it takes
                  about twenty seconds.
                </p>
                <label className="mt-6 block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Workspace name
                  </span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setStep(1)}
                    placeholder="e.g. Franko Labs"
                    className={inputCls}
                  />
                </label>
                <button
                  onClick={() => setStep(1)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
                >
                  Continue
                  <ArrowRight className="size-5" />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-semibold tracking-tight">
                  How do you sell?
                </h1>
                <p className="mt-2 text-[15px] text-ink-dim">
                  Pick a pipeline to start from — you can rename, add and
                  reorder stages anytime in Settings.
                </p>
                <div className="mt-5 space-y-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        template === t.id
                          ? "border-accent/60 bg-accent-dim/60"
                          : "border-edge bg-surface-2/40 hover:border-edge-strong"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-[15px] font-medium">{t.name}</span>
                        {template === t.id && (
                          <Check className="size-4 text-accent" />
                        )}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {[...t.stages, "Won", "Lost"].map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-ink-dim"
                          >
                            {s}
                          </span>
                        ))}
                      </span>
                      <span className="mt-2 block text-xs leading-relaxed text-ink-faint">
                        {t.blurb}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-dim transition hover:text-ink"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
                  >
                    Continue
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-2xl font-semibold tracking-tight">
                  Start with sample data?
                </h1>
                <p className="mt-2 text-[15px] text-ink-dim">
                  Sample data shows the whole system working — pipeline, Pulse
                  signals, the client portal. Recommended for a first look.
                </p>
                <div className="mt-5 space-y-3">
                  <button
                    onClick={() => setSampleData(true)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      sampleData
                        ? "border-accent/60 bg-accent-dim/60"
                        : "border-edge bg-surface-2/40 hover:border-edge-strong"
                    }`}
                  >
                    <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" />
                    <span>
                      <span className="block text-[15px] font-medium">
                        Explore with sample data
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                        8 companies, 11 deals and a live client portal, ready to
                        click through.
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => setSampleData(false)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                      !sampleData
                        ? "border-accent/60 bg-accent-dim/60"
                        : "border-edge bg-surface-2/40 hover:border-edge-strong"
                    }`}
                  >
                    <Database className="mt-0.5 size-5 shrink-0 text-ink-dim" />
                    <span>
                      <span className="block text-[15px] font-medium">
                        Start empty
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                        A clean workspace — add your own contacts and deals.
                      </span>
                    </span>
                  </button>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-dim transition hover:text-ink"
                  >
                    Back
                  </button>
                  <button
                    onClick={finish}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
                  >
                    Open workspace
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-ink-faint">
          Demo environment — data lives in this tab and resets on reload.
        </p>
      </div>
    </div>
  );
}
