import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/cn";

export interface ProcessStep {
  title: string;
  text: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Who acts at this step; rendered as a small caption. */
  actor: "Sistema" | "IA" | "Tú";
}

interface ProcessStepsProps {
  title: string;
  steps: ProcessStep[];
  /** `row` lays the steps side by side from md up; `column` always stacks them. */
  layout?: "row" | "column";
  className?: string;
}

/** Editorial explainer of how a screen's process works. Content is specific to each screen. */
export function ProcessSteps({ title, steps, layout = "column", className }: ProcessStepsProps) {
  return (
    <section
      aria-label={title}
      className={cn("rounded-2xl border border-border-soft bg-stone-50/70 p-4 sm:p-6", className)}
    >
      <h2 className="text-sm font-semibold tracking-tight text-stone-900">{title}</h2>
      <ol className={cn("mt-4 grid gap-4", layout === "row" && (steps.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4 md:gap-6" : "md:grid-cols-3 md:gap-6"))}>
        {steps.map(({ title: stepTitle, text, icon: Icon, actor }, index) => (
          <li key={stepTitle} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-white text-stone-700">
              <Icon width={17} height={17} />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-stone-900">
                <span className="font-mono text-[11px] font-medium text-stone-400">0{index + 1}</span>
                {stepTitle}
                <span className="text-[11px] font-medium text-stone-500">· {actor}</span>
              </p>
              <p className="text-xs leading-relaxed text-stone-600">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
