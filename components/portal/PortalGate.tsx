"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { Company } from "@/lib/crm/types";
import { useCrm } from "@/lib/crm/store";
import { usePortalAuth } from "@/lib/portal/auth";
import { entitlementsFor, type PortalToolId } from "@/lib/portal/portal";

type PortalGateProps = {
  /** The tool this window belongs to — clients without it see an upgrade note. */
  tool: PortalToolId;
  children: (company: Company) => ReactNode;
};

/** Wraps a portal window: signed out → /login, not entitled → plan note. */
export default function PortalGate({ tool, children }: PortalGateProps) {
  const router = useRouter();
  const { state } = useCrm();
  const { ready, company } = usePortalAuth();

  useEffect(() => {
    if (ready && !company) router.replace("/login");
  }, [ready, company, router]);

  if (!ready || !company) return null;

  if (!entitlementsFor(state, company).includes(tool)) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <Lock className="size-8 text-ink-dim" strokeWidth={1.5} />
        <div>
          <p className="text-[15px] font-medium">Not part of your plan yet</p>
          <p className="mx-auto mt-1 max-w-sm text-base leading-relaxed text-ink-dim">
            This tool isn&apos;t included in {company.name}&apos;s current
            services. Want it added? The team is one message away.
          </p>
        </div>
        <Link
          href="/contact"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-black transition hover:brightness-110"
        >
          Talk to the team
        </Link>
      </div>
    );
  }

  return <>{children(company)}</>;
}
