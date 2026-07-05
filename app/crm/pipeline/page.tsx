import type { Metadata } from "next";
import PipelineView from "@/components/crm/PipelineView";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return <PipelineView />;
}
