import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlBorder, controlClass, describedBy, Field } from "./Field";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, id, className, children, ...props }: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <Field fieldId={fieldId} label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn(
            controlClass,
            "h-11 cursor-pointer appearance-none truncate pr-9 sm:h-10",
            controlBorder(error),
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </Field>
  );
}
