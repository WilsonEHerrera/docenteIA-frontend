import { Badge } from "@/components/ui/Badge";
import type { AttendanceStatus } from "@/types/api";

interface ConfidenceBadgeProps {
  status: AttendanceStatus;
  /** 0–1 fraction or 0–100 percentage (TODO(api): the contract does not fix the scale). */
  confidence: number | null;
}

/** Low confidence is "No reconocido", never "Ausente" (CLAUDE.md §4.4). */
export function ConfidenceBadge({ status, confidence }: ConfidenceBadgeProps) {
  if (status === "UNRECOGNIZED") return <Badge variant="warning">No reconocido</Badge>;
  if (confidence === null) return null;
  const percent = Math.round(confidence <= 1 ? confidence * 100 : confidence);
  return <Badge variant="neutral">{percent} %</Badge>;
}
