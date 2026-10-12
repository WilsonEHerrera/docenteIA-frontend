import { errorMessage } from "@/lib/api/errors";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { RefreshIcon } from "./icons";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title }: ErrorStateProps) {
  return (
    <Alert
      variant="danger"
      title={title ?? (onRetry ? "No pudimos cargar esta información" : undefined)}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshIcon />
            Reintentar
          </Button>
        )
      }
    >
      {errorMessage(error)}
    </Alert>
  );
}
