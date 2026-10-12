"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, CloseIcon, InfoIcon } from "./icons";

type ToastVariant = "success" | "danger" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons = {
  success: { Icon: CheckCircleIcon, color: "text-emerald-700" },
  danger: { Icon: AlertCircleIcon, color: "text-rose-700" },
  warning: { Icon: AlertTriangleIcon, color: "text-amber-700" },
  info: { Icon: InfoIcon, color: "text-stone-500" },
} as const;

const DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Top on phones so it never covers the fixed action bars at the bottom. */}
      <div className="pointer-events-none fixed inset-x-4 top-[calc(var(--navbar)+0.75rem)] z-[200] flex flex-col items-end gap-2 sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm">
        {toasts.map((toast) => {
          const { Icon, color } = icons[toast.variant];
          return (
            <div
              key={toast.id}
              role={toast.variant === "danger" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border-soft bg-white py-3 pr-2 pl-4 shadow-lg",
                "transition-[opacity,translate] duration-200 starting:translate-y-2 starting:opacity-0",
              )}
            >
              <Icon className={cn("mt-px shrink-0", color)} />
              <p className="flex-1 text-[13px] leading-relaxed text-stone-800">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar aviso"
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
