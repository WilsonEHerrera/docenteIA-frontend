import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertCircleIcon } from "./icons";

/**
 * Shared control styles. 16 px text on phones avoids iOS zoom on focus; 14 px from sm up.
 * Focus keeps the global outline off and draws a ring instead, so the field does not jump.
 */
export const controlClass = cn(
  "w-full rounded-lg border bg-white px-3 text-base text-stone-900 shadow-xs sm:text-sm",
  "transition-[border-color,box-shadow] duration-150 placeholder:text-stone-400",
  "focus:outline-none focus-visible:outline-none focus:border-stone-900 focus:ring-3 focus:ring-stone-900/10",
  "disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500",
);

export function controlBorder(error?: string) {
  return error ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600/10" : "border-stone-300 hover:border-stone-400";
}

/** Ids for the message under a control, so aria-describedby points to the right one. */
export function describedBy(fieldId: string, error?: string, hint?: string) {
  return error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
}

interface FieldProps {
  fieldId: string;
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ fieldId, label, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={fieldId} className="block text-[13px] font-medium text-stone-800">
          {label}
        </label>
      )}
      {children}
      <FieldMessage id={fieldId} error={error} hint={hint} />
    </div>
  );
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs leading-relaxed text-rose-700">
        <AlertCircleIcon width={14} height={14} className="mt-px shrink-0" />
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-stone-500">
        {hint}
      </p>
    );
  }
  return null;
}
