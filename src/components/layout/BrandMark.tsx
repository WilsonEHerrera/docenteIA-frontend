import { cn } from "@/lib/cn";

/** Monochrome logomark: a "D" monogram on a dark tile. Decorative; the wordmark carries the name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 5h4.5a7 7 0 0 1 0 14H7z" />
        <path d="M11 12h2" />
      </svg>
    </span>
  );
}
