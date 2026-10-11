import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { InfoIcon } from "@/components/ui/icons";

interface ManualModeBannerProps {
  title?: string;
  children: ReactNode;
  onContinue?: () => void;
  loading?: boolean;
}

export function ManualModeBanner({
  title = "La IA no está disponible",
  children,
  onContinue,
  loading,
}: ManualModeBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"
    >
      <InfoIcon className="shrink-0 text-amber-700" width={20} height={20} />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-amber-700">{title}</p>
        <p className="text-xs leading-relaxed text-stone-700">{children}</p>
      </div>
      {onContinue && (
        <Button variant="secondary" onClick={onContinue} loading={loading}>
          Continuar en modo manual
        </Button>
      )}
    </div>
  );
}
