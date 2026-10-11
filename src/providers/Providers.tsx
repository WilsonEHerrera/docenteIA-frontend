"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "./AuthProvider";

// TODO: wrap with TanStack Query's QueryClientProvider once @tanstack/react-query is installed
// (docs/FRONTEND.md §3). It was deferred to avoid adding dependencies in Fase 0.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
