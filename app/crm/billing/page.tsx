import type { Metadata } from "next";
import BillingView from "@/components/crm/BillingView";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return <BillingView />;
}
