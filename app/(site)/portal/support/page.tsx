"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { SupportTool } from "@/components/portal/tools";

export default function PortalSupportPage() {
  return (
    <Window title="Support" path="~/portal/support" size="lg">
      <PortalGate tool="support">
        {(company) => <SupportTool company={company} />}
      </PortalGate>
    </Window>
  );
}
