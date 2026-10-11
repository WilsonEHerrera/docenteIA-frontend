"use client";

import { LogOutIcon, MenuIcon } from "@/components/ui/icons";
import { initials } from "@/lib/auth/roles";
import type { User } from "@/types/api";

interface NavbarProps {
  user: User;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function Navbar({ user, menuOpen, onToggleMenu, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-100 flex h-[52px] items-center justify-between gap-3 border-b border-[#EFEFEF] bg-white px-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer md:hidden"
        >
          <MenuIcon />
        </button>
        <span className="text-base font-bold tracking-tight text-stone-900">DocentIA</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-stone-600 sm:inline">{user.fullName}</span>
        <span
          role="img"
          aria-label={`Sesión de ${user.fullName}`}
          className="flex size-7 items-center justify-center rounded-full bg-[#111] text-[11px] font-semibold text-white"
        >
          {initials(user.fullName)}
        </span>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <LogOutIcon />
        </button>
      </div>
    </header>
  );
}
