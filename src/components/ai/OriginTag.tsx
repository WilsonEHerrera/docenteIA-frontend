import { Badge } from "@/components/ui/Badge";
import { GaugeIcon, SparkIcon, UserCheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** "Sugerido por IA": the one label for AI proposals still pending the teacher's decision. */
export function AiBadge({ className }: { className?: string }) {
  return (
    <Badge variant="info" className={className}>
      <SparkIcon />
      Sugerido por IA
    </Badge>
  );
}

type Origin = "auto" | "ai" | "teacher";

const origins: Record<Origin, { label: string; Icon: typeof GaugeIcon }> = {
  auto: { label: "Cálculo automático", Icon: GaugeIcon },
  ai: { label: "Propuesta de la IA", Icon: SparkIcon },
  teacher: { label: "Requiere tu decisión", Icon: UserCheckIcon },
};

/**
 * Quiet, neutral tag that says where a block of information comes from
 * (the system calculated it, the AI proposed it, or the teacher must decide). Not a status.
 */
export function OriginTag({ origin, label, className }: { origin: Origin; label?: string; className?: string }) {
  const { label: fallback, Icon } = origins[origin];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap text-stone-500",
        className,
      )}
    >
      <Icon width={14} height={14} />
      {label ?? fallback}
    </span>
  );
}
