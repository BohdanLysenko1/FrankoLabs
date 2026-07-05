import type { Metadata, Viewport } from "next";
import { CrmProvider } from "@/lib/crm/store";
import Shell from "@/components/crm/Shell";

export const metadata: Metadata = {
  title: {
    default: "Franko CRM",
    template: "%s — Franko CRM",
  },
  description:
    "The relationship module of Franko OS — pipeline, contacts, tasks, client portal and Pulse deal-health monitoring.",
};

export const viewport: Viewport = {
  themeColor: "#060608",
  colorScheme: "dark",
};

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CrmProvider>
      <Shell>{children}</Shell>
    </CrmProvider>
  );
}
