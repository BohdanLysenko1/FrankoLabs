import {
  LayoutGrid,
  Boxes,
  Hexagon,
  FolderOpen,
  BookOpen,
  Info,
  Mail,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";

export type OSApp = {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Full-screen apps launch in their own tab, like opening a program. */
  newTab?: boolean;
};

/** The applications installed in Franko OS. Order = dock order. */
export const apps: OSApp[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/",
    icon: LayoutGrid,
    description: "System overview and connected modules",
  },
  {
    id: "solutions",
    name: "Solutions",
    href: "/solutions",
    icon: Boxes,
    description: "Agency services as system modules",
  },
  {
    id: "pricing",
    name: "Pricing",
    href: "/pricing",
    icon: Tag,
    description: "Website plans and custom project quotes",
  },
  {
    id: "products",
    name: "Products",
    href: "/products",
    icon: Hexagon,
    description: "Franko OS and installed applications",
  },
  {
    id: "crm",
    name: "CRM",
    href: "/crm",
    icon: Users,
    description: "Franko CRM — live early-access app",
    newTab: true,
  },
  {
    id: "projects",
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
    description: "Shipped work and case studies",
  },
  {
    id: "resources",
    name: "Resources",
    href: "/resources",
    icon: BookOpen,
    description: "Documentation, guides and FAQ",
  },
  {
    id: "about",
    name: "About",
    href: "/about",
    icon: Info,
    description: "Mission, model and roadmap",
  },
  {
    id: "contact",
    name: "Contact",
    href: "/contact",
    icon: Mail,
    description: "Book a consultation or request an audit",
  },
];
