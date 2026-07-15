import type { Metadata } from "next";
import LeadsView from "@/components/crm/LeadsView";

export const metadata: Metadata = { title: "Bulk Leads" };

export default function LeadsPage() {
  return <LeadsView />;
}
