"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { VaultTool } from "@/components/portal/tools-desk";

export default function PortalVaultPage() {
  return (
    <Window title="Password Vault" path="~/portal/vault" size="lg">
      <PortalGate tool="vault">
        {(company) => <VaultTool company={company} />}
      </PortalGate>
    </Window>
  );
}
