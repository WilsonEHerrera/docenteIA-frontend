import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlBorder, controlClass, describedBy, Field } from "./Field";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, className, ...props }: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <Field fieldId={fieldId} label={label} error={error} hint={hint}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn(controlClass, "min-h-28 resize-y py-2.5 leading-relaxed", controlBorder(error), className)}
        {...props}
      />
    </Field>
  );
}
