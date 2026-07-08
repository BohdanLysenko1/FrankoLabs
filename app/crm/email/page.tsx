import type { Metadata } from "next";
import EmailView from "@/components/crm/EmailView";

export const metadata: Metadata = { title: "Email" };

export default function EmailPage() {
  return <EmailView />;
}
