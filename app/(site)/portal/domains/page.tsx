"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { DomainsTool } from "@/components/portal/tools-infra";

export default function PortalDomainsPage() {
  return (
    <Window title="Domains & DNS" path="~/portal/domains" size="lg">
      <PortalGate tool="domains">
        {(company) => <DomainsTool company={company} />}
      </PortalGate>
    </Window>
  );
}
