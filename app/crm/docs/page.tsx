import type { Metadata } from "next";
import DocsView from "@/components/crm/DocsView";

export const metadata: Metadata = { title: "Docs" };

export default function DocsPage() {
  return <DocsView />;
}
