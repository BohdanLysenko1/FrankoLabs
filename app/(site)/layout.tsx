import Desktop from "@/components/os/Desktop";
import { CrmProvider } from "@/lib/crm/store";
import { PortalAuthProvider } from "@/lib/portal/auth";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The client portal reads the same store the CRM manages — signing in
  // "unlocks" the data the agency already curates there.
  return (
    <CrmProvider>
      <PortalAuthProvider>
        <Desktop>{children}</Desktop>
      </PortalAuthProvider>
    </CrmProvider>
  );
}
