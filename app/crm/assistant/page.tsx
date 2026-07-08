import type { Metadata } from "next";
import AssistantView from "@/components/crm/AssistantView";

export const metadata: Metadata = { title: "Assistant" };

export default function AssistantPage() {
  return <AssistantView />;
}
