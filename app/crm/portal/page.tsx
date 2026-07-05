import type { Metadata } from "next";
import PortalView from "@/components/crm/PortalView";

export const metadata: Metadata = { title: "Client portal" };

export default function PortalPage() {
  return <PortalView />;
}
