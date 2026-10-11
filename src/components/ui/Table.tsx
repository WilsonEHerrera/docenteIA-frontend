import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Set a max height here (e.g. `max-h-[70vh]`) so the sticky header sticks while scrolling. */
  containerClassName?: string;
}

export function Table({ className, containerClassName, ...props }: TableProps) {
  return (
    <div
      className={cn("overflow-auto rounded-xl border border-border-soft bg-white", containerClassName)}
    >
      <table className={cn("w-full border-collapse text-xs text-stone-700", className)} {...props} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-border-soft" {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-stone-50 transition-colors", className)} {...props} />;
}

interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

/** Sticky header cell. */
export function TH({ numeric, className, ...props }: THProps) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 bg-stone-50 border-b border-border-soft px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-600",
        numeric ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

interface TDProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Right-aligned, monospaced (grades, percentages, IDs). */
  numeric?: boolean;
}

export function TD({ numeric, className, ...props }: TDProps) {
  return (
    <td
      className={cn("px-3 py-2", numeric && "text-right font-mono tabular-nums", className)}
      {...props}
    />
  );
}
