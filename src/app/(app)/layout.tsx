"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/providers/AuthProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    // Real route protection by session and role is middleware.ts (Fase 2).
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated" || !user) {
    return (
      <div className="flex-1 space-y-4 p-6" role="status" aria-label="Cargando sesión">
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar
        user={user}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onLogout={() => void logout()}
      />
      <Sidebar role={user.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="flex-1 bg-dashboard p-4 md:pl-[calc(52px+1.5rem)] md:pr-6 md:py-6">
        {children}
      </main>
    </div>
  );
}
