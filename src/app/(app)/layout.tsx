"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { navItemsForRole, NAV_ITEMS } from "@/components/layout/nav-items";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertCircleIcon, RefreshIcon, ShieldIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { loginUrlForCurrentLocation } from "@/lib/auth/return-path";
import { useAuth } from "@/providers/AuthProvider";

function SessionSkeleton() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-dashboard" role="status" aria-label="Cargando sesión">
      <div className="h-navbar border-b border-border-soft bg-white" />
      <div className="mx-auto w-full max-w-[96rem] space-y-4 px-4 py-6 sm:px-6 md:pl-[calc(var(--rail)+1.5rem)] lg:py-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, status, endReason, logout, retry } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
    // Only a confirmed "no session" leaves the page; "loading" and "unreachable" never do.
    // An expired session keeps the current URL as ?next= so signing in returns here; an explicit
    // logout does not. Real authorization is still enforced by the backend on every request.
    if (status !== "unauthenticated") return;
    router.replace(endReason === "logout" ? "/login" : loginUrlForCurrentLocation());
  }, [status, endReason, router]);

  if (status === "unreachable") {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-dashboard p-4">
        <div className="w-full max-w-md">
          <EmptyState
            icon={<AlertCircleIcon width={20} height={20} />}
            title="No pudimos verificar tu sesión"
            description="El servidor no respondió. Tu sesión no se ha cerrado: vuelve a intentarlo en unos segundos."
            action={
              <Button onClick={retry}>
                <RefreshIcon />
                Reintentar
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  if (status !== "authenticated" || !user) return <SessionSkeleton />;

  // Route-level role check from the same table that builds the menu (UX only; the backend decides).
  const section = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const allowed = !section || navItemsForRole(user.role).includes(section);

  return (
    <div className="flex min-h-screen flex-1 flex-col overflow-x-clip">
      <a
        href="#contenido"
        className="sr-only z-[300] rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Navbar
        user={user}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onLogout={() => void logout()}
      />
      <Sidebar role={user.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main id="contenido" tabIndex={-1} className="flex-1 bg-dashboard focus:outline-none md:pl-rail">
        <div className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {allowed ? (
            children
          ) : (
            <EmptyState
              icon={<ShieldIcon width={20} height={20} />}
              title="No tienes acceso a esta sección"
              description="Tu rol no incluye esta pantalla. Si crees que es un error, contacta al administrador."
            />
          )}
        </div>
      </main>
    </div>
  );
}
