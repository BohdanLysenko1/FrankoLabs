"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { ContractsTool } from "@/components/portal/tools-desk";

export default function PortalContractsPage() {
  return (
    <Window title="Contracts" path="~/portal/contracts" size="lg">
      <PortalGate tool="contracts">
        {(company) => <ContractsTool company={company} />}
      </PortalGate>
    </Window>
  );
}
