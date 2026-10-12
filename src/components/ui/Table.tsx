import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Set a max height here (e.g. `max-h-[70vh]`) so the sticky header sticks while scrolling. */
  containerClassName?: string;
  /** Accessible name for the scroll region (keyboard users can scroll it with the arrow keys). */
  label?: string;
}

/**
 * Scrolls horizontally inside its own box on narrow screens, so the page never overflows.
 * Use `sticky` on the first TH/TD to keep the row label visible while scrolling sideways.
 */
export function Table({ className, containerClassName, label, ...props }: TableProps) {
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      className={cn(
        "overflow-auto overscroll-x-contain rounded-xl border border-border-soft bg-white shadow-xs",
        containerClassName,
      )}
    >
      <table className={cn("w-full border-separate border-spacing-0 text-[13px] text-stone-700", className)} {...props} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="[&>tr:last-child>td]:border-b-0" {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("group/row", className)} {...props} />;
}

interface CellOptions {
  /** Right-aligned, monospaced (grades, percentages, IDs). */
  numeric?: boolean;
  /** Pinned to the left edge while the table scrolls horizontally. */
  sticky?: boolean;
}

/** Sticky header cell. */
export function TH({ numeric, sticky, className, ...props }: CellOptions & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 border-b border-border-soft bg-stone-50 px-3 py-2.5 align-bottom whitespace-nowrap",
        "text-[11px] font-semibold tracking-wide text-stone-600 uppercase",
        numeric ? "text-right" : "text-left",
        sticky && "left-0 z-20 shadow-[1px_0_0_var(--border-soft)]",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ numeric, sticky, className, ...props }: CellOptions & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-border-soft bg-white px-3 py-3 align-middle transition-colors group-hover/row:bg-stone-50",
        numeric && "text-right font-mono tabular-nums",
        sticky && "sticky left-0 z-[5] shadow-[1px_0_0_var(--border-soft)]",
        className,
      )}
      {...props}
    />
  );
}
