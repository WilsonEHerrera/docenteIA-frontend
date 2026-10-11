import type { Role } from "@/types/api";

export function hasRole(role: Role | undefined, allowed: readonly Role[]): boolean {
  return role !== undefined && allowed.includes(role);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  TEACHER: "Docente",
  COORDINATOR: "Coordinador",
  STUDENT: "Estudiante",
  GUARDIAN: "Acudiente",
};
