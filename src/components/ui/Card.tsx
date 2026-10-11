import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "bg-white border border-border-soft rounded-2xl p-6 shadow-xs space-y-4",
        className,
      )}
      {...props}
    />
  );
}
