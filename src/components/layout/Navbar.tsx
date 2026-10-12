"use client";

import Link from "next/link";
import { CloseIcon, LogOutIcon, MenuIcon } from "@/components/ui/icons";
import { initials, ROLE_LABELS } from "@/lib/auth/roles";
import type { User } from "@/types/api";
import { BrandMark } from "./BrandMark";

interface NavbarProps {
  user: User;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export function Navbar({ user, menuOpen, onToggleMenu, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-[100] flex h-navbar items-center justify-between gap-3 border-b border-border-soft bg-white/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:px-3">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-stone-700 transition-colors hover:bg-stone-100 md:hidden"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Link href="/inicio" className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 md:px-2.5">
          <BrandMark />
          <span className="text-[15px] font-bold tracking-tight text-stone-900">DocentIA</span>
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-[13px] leading-tight font-medium text-stone-900">{user.fullName}</p>
          <p className="text-[11px] leading-tight text-stone-500">{ROLE_LABELS[user.role]}</p>
        </div>
        <span
          role="img"
          aria-label={`Sesión de ${user.fullName}, ${ROLE_LABELS[user.role]}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[11px] font-semibold text-white"
        >
          {initials(user.fullName)}
        </span>
        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border-soft sm:block" />
        <button
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900 sm:h-9"
        >
          <LogOutIcon />
          <span className="hidden lg:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
