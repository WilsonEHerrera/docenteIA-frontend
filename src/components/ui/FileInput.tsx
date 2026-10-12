import { useId, type ChangeEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { UploadIcon } from "./icons";

interface FileInputProps {
  label: string;
  /** Formats and limits, shown next to the button. */
  hint?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  buttonLabel?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Selected files, rendered inside the picker box. */
  children?: ReactNode;
}

/** Native file input behind a styled label; keyboard focus is shown on the whole box. */
export function FileInput({
  label,
  hint,
  accept,
  multiple,
  disabled,
  buttonLabel,
  onChange,
  children,
}: FileInputProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <p id={`${id}-label`} className="text-[13px] font-medium text-stone-800">
        {label}
      </p>
      <div
        className={cn(
          "rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-3 transition-colors sm:p-4",
          "has-[input:focus-visible]:border-stone-900 has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-stone-900/10",
          !disabled && "hover:border-stone-400",
        )}
      >
        <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-4">
          <label
            className={cn(
              "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg whitespace-nowrap border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 shadow-xs transition-colors hover:bg-stone-50 sm:h-10",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <UploadIcon width={16} height={16} />
            {buttonLabel ?? (multiple ? "Elegir archivos" : "Elegir archivo")}
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              aria-labelledby={`${id}-label`}
              aria-describedby={hint ? `${id}-hint` : undefined}
              onChange={onChange}
              className="sr-only"
            />
          </label>
          {hint && (
            <p id={`${id}-hint`} className="text-xs leading-relaxed text-stone-500">
              {hint}
            </p>
          )}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

/** One selected file inside a FileInput box. */
export function FileChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border-soft bg-white py-1.5 pr-1.5 pl-3">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-stone-700" title={name}>
        {name}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${name}`}
          className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          Quitar
        </button>
      )}
    </div>
  );
}
