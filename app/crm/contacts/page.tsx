import type { Metadata } from "next";
import ContactsView from "@/components/crm/ContactsView";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <ContactsView />;
}
