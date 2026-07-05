import type { Metadata } from "next";
import CompaniesView from "@/components/crm/CompaniesView";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return <CompaniesView />;
}
