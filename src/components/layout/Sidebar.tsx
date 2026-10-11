"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/api";
import { navItemsForRole } from "./nav-items";

interface SidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <>
      {open && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 top-[52px] z-40 bg-[rgba(0,0,0,.3)] md:hidden"
        />
      )}
      <aside
        id="app-sidebar"
        className={cn(
          "group fixed bottom-0 left-0 top-[52px] z-50 overflow-hidden border-r border-[#EFEFEF] bg-white",
          "w-[220px] -translate-x-full transition-transform duration-200",
          open && "translate-x-0",
          "md:w-[52px] md:translate-x-0 md:transition-[width] md:hover:w-[200px] md:focus-within:w-[200px]",
        )}
      >
        <nav aria-label="Navegación principal" className="flex flex-col gap-1 p-1.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 whitespace-nowrap rounded-lg px-[11px] text-xs font-medium transition-colors",
                  active
                    ? "bg-[#F0F0F0] text-[#111]"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                <Icon className="shrink-0" />
                <span className="md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
