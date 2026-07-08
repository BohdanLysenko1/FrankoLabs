import type { Metadata } from "next";
import WebsitesView from "@/components/crm/WebsitesView";

export const metadata: Metadata = { title: "Websites" };

export default function WebsitesPage() {
  return <WebsitesView />;
}
