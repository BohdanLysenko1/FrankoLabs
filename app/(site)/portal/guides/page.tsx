"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { GuidesTool } from "@/components/portal/tools-desk";

export default function PortalGuidesPage() {
  return (
    <Window title="Guides" path="~/portal/guides" size="lg">
      <PortalGate tool="guides">
        {(company) => <GuidesTool company={company} />}
      </PortalGate>
    </Window>
  );
}
