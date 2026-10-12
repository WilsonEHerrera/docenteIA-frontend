import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BarItem {
  key: string;
  label: string;
  /** Secondary line under the label (course, subject…). */
  sublabel?: string;
  value: number;
  /** Text shown at the end of the row; defaults to the value. */
  display?: ReactNode;
  /** Status fill for state, never for identity. Paired with text in `display`. */
  status?: "warning" | "danger";
}

interface BarListProps {
  items: BarItem[];
  /** Scale maximum; defaults to the largest value. */
  max?: number;
  /** Accessible description of what the bars measure. */
  label: string;
  /** Unit read in each row's tooltip, e.g. "estudiantes". */
  unit?: string;
}

const fills = { default: "bg-stone-800", warning: "bg-amber-500", danger: "bg-rose-600" } as const;

/**
 * Single-series horizontal bars: one hue, thin marks, value labeled at the end of each row
 * (so no legend is needed). Each row has a hover tooltip and is a real list item for screen readers.
 */
export function BarList({ items, max, label, unit }: BarListProps) {
  const scale = Math.max(1, max ?? Math.max(...items.map((item) => item.value)));
  return (
    <ul aria-label={label} className="space-y-3.5">
      {items.map((item) => {
        const pct = Math.min(100, (item.value / scale) * 100);
        return (
          <li
            key={item.key}
            className="group space-y-1.5"
            title={`${item.label}: ${item.value}${unit ? ` ${unit}` : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] text-stone-800">
                {item.label}
                {item.sublabel && <span className="ml-1.5 text-xs text-stone-500">{item.sublabel}</span>}
              </span>
              <span className="shrink-0 font-mono text-xs font-semibold text-stone-900 tabular-nums">
                {item.display ?? item.value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
              <div
                className={cn(
                  "h-full rounded-full transition-[width,opacity] duration-500 group-hover:opacity-80",
                  fills[item.status ?? "default"],
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
