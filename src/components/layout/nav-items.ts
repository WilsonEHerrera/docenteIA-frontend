import type { ComponentType, SVGProps } from "react";
import {
  CameraIcon,
  ChartIcon,
  FileCheckIcon,
  HomeIcon,
  QuizIcon,
  ShieldIcon,
  TableIcon,
} from "@/components/ui/icons";
import type { Role } from "@/types/api";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Hiding by role is UX only; real authorization is enforced by the backend. */
  roles: readonly Role[];
}

const ALL_ROLES: readonly Role[] = ["ADMIN", "TEACHER", "COORDINATOR", "STUDENT", "GUARDIAN"];

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: HomeIcon, roles: ALL_ROLES },
  { href: "/asistencia", label: "Asistencia", icon: CameraIcon, roles: ["TEACHER"] },
  { href: "/entregas", label: "Entregas", icon: FileCheckIcon, roles: ["TEACHER"] },
  { href: "/notas", label: "Notas", icon: TableIcon, roles: ["TEACHER", "COORDINATOR", "STUDENT"] },
  { href: "/cuestionarios", label: "Cuestionarios", icon: QuizIcon, roles: ["TEACHER", "STUDENT"] },
  { href: "/reportes", label: "Reportes", icon: ChartIcon, roles: ["TEACHER", "COORDINATOR"] },
  { href: "/admin", label: "Admin", icon: ShieldIcon, roles: ["ADMIN"] },
];

export function navItemsForRole(role: Role | undefined): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
