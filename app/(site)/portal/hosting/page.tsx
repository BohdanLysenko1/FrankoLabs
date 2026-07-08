"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { HostingTool } from "@/components/portal/tools-infra";

export default function PortalHostingPage() {
  return (
    <Window title="Hosting" path="~/portal/hosting" size="lg">
      <PortalGate tool="hosting">
        {(company) => <HostingTool company={company} />}
      </PortalGate>
    </Window>
  );
}
