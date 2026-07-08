"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { AnalyticsTool } from "@/components/portal/tools-infra";

export default function PortalAnalyticsPage() {
  return (
    <Window title="Analytics" path="~/portal/analytics" size="lg">
      <PortalGate tool="analytics">
        {(company) => <AnalyticsTool company={company} />}
      </PortalGate>
    </Window>
  );
}
