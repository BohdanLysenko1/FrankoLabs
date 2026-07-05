"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { BillingTool } from "@/components/portal/tools";

export default function PortalBillingPage() {
  return (
    <Window title="Billing" path="~/portal/billing" size="lg">
      <PortalGate tool="billing">
        {(company) => <BillingTool company={company} />}
      </PortalGate>
    </Window>
  );
}
