import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

// `cn` only joins classes, so padding and spacing are props instead of className overrides
// (two conflicting utilities would resolve by stylesheet order, not by the order written).
const paddings = { none: "", md: "p-4 sm:p-6", lg: "p-6 sm:p-8" } as const;
const spacings = { none: "", sm: "space-y-3", md: "space-y-4", lg: "space-y-6" } as const;
/** Border tone: `ai` marks content proposed by the AI and still pending review. */
const tones = { default: "border-border-soft", ai: "border-sky-200", danger: "border-rose-300" } as const;

interface CardProps extends HTMLAttributes<HTMLElement> {
  padding?: keyof typeof paddings;
  spacing?: keyof typeof spacings;
  tone?: keyof typeof tones;
}

export function Card({ padding = "md", spacing = "md", tone = "default", className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-white shadow-xs",
        tones[tone],
        paddings[padding],
        spacings[spacing],
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot: a badge, an origin tag or a small action. */
  aside?: ReactNode;
  as?: "h2" | "h3";
}

export function CardHeader({ title, description, aside, as: Heading = "h2" }: CardHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0 space-y-1">
        <Heading className="text-base font-semibold tracking-tight text-stone-900">{title}</Heading>
        {description && <p className="text-[13px] leading-relaxed text-stone-600">{description}</p>}
      </div>
      {aside && <div className="flex shrink-0 items-center gap-2">{aside}</div>}
    </div>
  );
}
