import {
  Activity,
  BookOpen,
  Building2,
  CalendarDays,
  ChartColumn,
  FilePen,
  Globe,
  Handshake,
  Kanban,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MailPlus,
  Receipt,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

/** CRM navigation registry — single source for the sidebar and the command palette. */

export type CrmNavItem = { label: string; href: string; icon: LucideIcon };

export type CrmNavGroup = { label: string | null; items: CrmNavItem[] };

export const crmNavGroups: CrmNavGroup[] = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/crm", icon: LayoutDashboard },
      { label: "Pulse", href: "/crm/pulse", icon: Activity },
      { label: "Reports", href: "/crm/reports", icon: ChartColumn },
    ],
  },
  {
    label: "Sell",
    items: [
      { label: "Pipeline", href: "/crm/pipeline", icon: Kanban },
      { label: "Bulk Leads", href: "/crm/leads", icon: Target },
      { label: "Contacts", href: "/crm/contacts", icon: Users },
      { label: "Companies", href: "/crm/companies", icon: Building2 },
    ],
  },
  {
    label: "Deliver",
    items: [
      { label: "Clients", href: "/crm/portal", icon: Handshake },
      { label: "Tasks", href: "/crm/tasks", icon: ListChecks },
      { label: "Calendar", href: "/crm/calendar", icon: CalendarDays },
      { label: "Websites", href: "/crm/websites", icon: Globe },
      { label: "Support", href: "/crm/support", icon: LifeBuoy },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Billing", href: "/crm/billing", icon: Receipt },
      { label: "Contracts", href: "/crm/contracts", icon: FilePen },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Docs", href: "/crm/docs", icon: BookOpen },
      { label: "Vault", href: "/crm/vault", icon: KeyRound },
      { label: "Email", href: "/crm/email", icon: MailPlus },
      { label: "Assistant", href: "/crm/assistant", icon: Sparkles },
    ],
  },
];

export const crmNav = crmNavGroups.flatMap((g) => g.items);
