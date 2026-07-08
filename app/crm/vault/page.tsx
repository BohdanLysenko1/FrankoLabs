import type { Metadata } from "next";
import VaultView from "@/components/crm/VaultView";

export const metadata: Metadata = { title: "Vault" };

export default function VaultPage() {
  return <VaultView />;
}
