import type { Metadata } from "next";
import ContractsView from "@/components/crm/ContractsView";

export const metadata: Metadata = { title: "Contracts" };

export default function ContractsPage() {
  return <ContractsView />;
}
