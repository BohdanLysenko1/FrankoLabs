"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { WebsiteTool } from "@/components/portal/tools";

export default function PortalWebsitePage() {
  return (
    <Window title="Website" path="~/portal/website" size="lg">
      <PortalGate tool="website">
        {(company) => <WebsiteTool company={company} />}
      </PortalGate>
    </Window>
  );
}
