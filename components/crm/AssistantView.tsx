"use client";

import { Sparkles } from "lucide-react";
import { AssistantChat } from "@/components/portal/tools-desk";

export default function AssistantView() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4 md:p-8 md:pb-4">
      <div className="flex items-center gap-3 pb-5">
        <Sparkles className="size-7 text-accent" strokeWidth={1.75} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
          <p className="text-sm text-ink-dim">
            An operator that knows the whole business — pipeline, billing,
            contracts, support.
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-edge bg-surface/90">
        <AssistantChat
          scope={{ kind: "agency" }}
          greeting="Morning. I can see the whole workspace — pipeline, invoices, contracts, tickets. Ask me anything, or hit a suggestion below."
        />
      </div>
    </div>
  );
}
