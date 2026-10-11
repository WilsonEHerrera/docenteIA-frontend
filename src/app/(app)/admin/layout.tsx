"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RoleGate } from "@/components/layout/RoleGate";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/matricula", label: "Matrícula" },
  { href: "/admin/auditoria", label: "Auditoría" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <RoleGate roles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Administración</h1>
          <nav aria-label="Secciones de administración" className="flex flex-wrap gap-1.5">
            {LINKS.map((link) => {
              const active =
                link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:text-stone-900",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {children}
      </div>
    </RoleGate>
  );
}
