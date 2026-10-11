"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { hasRole } from "@/lib/auth/roles";
import { useAuth } from "@/providers/AuthProvider";
import type { Role } from "@/types/api";

/** UX-only guard: the backend enforces the real authorization (CLAUDE.md §4.3). */
export function RoleGate({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { user, status } = useAuth();
  if (status === "loading") return <Skeleton className="h-40 w-full" />;
  if (!hasRole(user?.role, roles)) {
    return (
      <EmptyState
        title="No tienes acceso a esta sección"
        description="Tu rol no incluye esta pantalla. Si crees que es un error, contacta al administrador."
      />
    );
  }
  return <>{children}</>;
}
