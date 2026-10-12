"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RoleGate } from "@/components/layout/RoleGate";
import { PageHeader } from "@/components/ui/PageHeader";
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
        <div className="space-y-4">
          <PageHeader title="Administración" description="Institución, usuarios, cursos, matrícula y auditoría." />
          <nav aria-label="Secciones de administración" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex min-w-max gap-1 border-b border-border-soft">
              {LINKS.map((link) => {
                const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative -mb-px flex h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "border-stone-900 text-stone-900"
                          : "border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        {children}
      </div>
    </RoleGate>
  );
}
