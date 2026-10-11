import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, id, className, children, ...props }: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-medium text-stone-700">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className={cn(
          "w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 text-xs font-sans",
          "focus:outline-none focus:border-stone-900 transition-colors cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
