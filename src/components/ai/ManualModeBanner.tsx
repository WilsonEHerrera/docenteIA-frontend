import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

interface ManualModeBannerProps {
  title?: string;
  children: ReactNode;
  onContinue?: () => void;
  loading?: boolean;
}

/** The AI is down or cannot be used: explain it and offer the manual path. */
export function ManualModeBanner({
  title = "La IA no está disponible",
  children,
  onContinue,
  loading,
}: ManualModeBannerProps) {
  return (
    <Alert
      variant="warning"
      title={title}
      action={
        onContinue && (
          <Button variant="secondary" size="sm" onClick={onContinue} loading={loading}>
            Continuar en modo manual
          </Button>
        )
      }
    >
      {children}
    </Alert>
  );
}
