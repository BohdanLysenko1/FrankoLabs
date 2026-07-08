"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { AssistantTool } from "@/components/portal/tools-desk";

export default function PortalAssistantPage() {
  return (
    <Window title="Assistant" path="~/portal/assistant" size="lg">
      <PortalGate tool="assistant">
        {(company) => <AssistantTool company={company} />}
      </PortalGate>
    </Window>
  );
}
