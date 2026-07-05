import type { Metadata } from "next";
import PulseView from "@/components/crm/PulseView";

export const metadata: Metadata = { title: "Pulse" };

export default function PulsePage() {
  return <PulseView />;
}
