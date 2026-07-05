import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion, ArrowRight } from "lucide-react";
import Desktop from "@/components/os/Desktop";
import Window from "@/components/os/Window";
import { CrmProvider } from "@/lib/crm/store";
import { PortalAuthProvider } from "@/lib/portal/auth";

export const metadata: Metadata = {
  title: "Not found",
  description: "This path doesn't exist in Franko OS.",
};

export default function NotFound() {
  return (
    <CrmProvider>
    <PortalAuthProvider>
    <Desktop>
      <Window title="Not Found" path="~/404" size="md">
      <div className="flex flex-col items-center p-6 py-16 text-center md:p-10 md:py-20">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-edge bg-surface-3">
          <FileQuestion className="size-10 text-ink-dim" strokeWidth={1.5} />
        </div>
        <p className="mt-6 font-mono text-xs text-ink-faint">
          error 404 — path not mounted
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Nothing installed here
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-dim">
          The path you opened doesn&apos;t exist in Franko OS. It may have
          moved, or it was never mounted in the first place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-black transition hover:brightness-110"
          >
            Back to Dashboard
            <ArrowRight className="size-5" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-2/60 px-6 py-3 text-base font-medium transition hover:border-edge-strong hover:bg-surface-2"
          >
            Browse modules
          </Link>
        </div>
      </div>
      </Window>
    </Desktop>
    </PortalAuthProvider>
    </CrmProvider>
  );
}
