import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { controlBorder, controlClass, describedBy, Field } from "./Field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Control placed inside the field on the right (e.g. show/hide password). Reserves room so text never runs under it. */
  trailing?: ReactNode;
}

export function Input({ label, error, hint, trailing, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <input
      id={inputId}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(inputId, error, hint)}
      className={cn(controlClass, "h-11 sm:h-10", trailing ? "pr-12" : undefined, controlBorder(error), className)}
      {...props}
    />
  );

  return (
    <Field fieldId={inputId} label={label} error={error} hint={hint}>
      {trailing ? (
        <div className="relative">
          {input}
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>
        </div>
      ) : (
        input
      )}
    </Field>
  );
}
