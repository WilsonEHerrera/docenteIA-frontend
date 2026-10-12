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

/**
 * Phones/tablets: off-canvas drawer (invisible, so its links are out of the tab order, while closed).
 * md and up: icon rail that expands over the content on hover or keyboard focus.
 */
export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 top-navbar z-40 bg-stone-950/30 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        id="app-sidebar"
        className={cn(
          "group fixed bottom-0 left-0 top-navbar z-50 flex flex-col overflow-x-hidden overflow-y-auto border-r border-border-soft bg-white",
          "w-[min(272px,85vw)] transition-[translate,width,visibility,box-shadow] duration-200 ease-out",
          open ? "visible translate-x-0 shadow-lg" : "invisible -translate-x-full",
          "md:visible md:w-rail md:translate-x-0 md:shadow-none",
          "md:hover:w-[232px] md:hover:shadow-lg md:focus-within:w-[232px] md:focus-within:shadow-lg",
        )}
      >
        <nav aria-label="Navegación principal" className="flex flex-col gap-1 p-2.5">
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
                  "relative flex h-11 items-center gap-3 rounded-lg px-[11px] text-sm font-medium whitespace-nowrap transition-colors md:h-10",
                  active
                    ? "bg-stone-100 text-stone-900"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
                )}
              >
                {active && (
                  <span aria-hidden="true" className="absolute top-2 bottom-2 -left-2.5 w-[3px] rounded-r-full bg-stone-900" />
                )}
                <Icon className="shrink-0" />
                <span className="transition-opacity duration-150 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto border-t border-border-soft px-4 py-4 text-xs leading-relaxed text-stone-500 transition-opacity duration-150 md:w-[232px] md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          La automatización calcula y avisa, la IA interpreta y sugiere,{" "}
          <span className="font-medium text-stone-700">tú decides.</span>
        </p>
      </aside>
    </>
  );
}
