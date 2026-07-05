"use client";

import Window from "@/components/os/Window";
import PortalGate from "@/components/portal/PortalGate";
import { ProjectsTool } from "@/components/portal/tools";

export default function PortalProjectsPage() {
  return (
    <Window title="Projects" path="~/portal/projects" size="lg">
      <PortalGate tool="projects">
        {(company) => <ProjectsTool company={company} />}
      </PortalGate>
    </Window>
  );
}
