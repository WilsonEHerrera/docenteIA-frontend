import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-medium text-stone-700">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          "w-full bg-white border rounded-lg px-3 py-2 text-stone-900 text-xs font-sans min-h-24",
          "focus:outline-none focus:border-stone-900 transition-colors placeholder:text-stone-500",
          error ? "border-rose-600" : "border-stone-300",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="text-[11px] text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
