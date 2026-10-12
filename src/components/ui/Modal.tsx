"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

/**
 * Built on native <dialog>: focus trap, Esc to close and inert background come from the browser.
 * Bottom sheet on phones, centered panel from sm up; the body scrolls when content is taller than the screen.
 */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "mx-0 mt-auto mb-0 max-h-[calc(100dvh-1.5rem)] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border border-border-soft bg-white p-0 text-stone-900 shadow-lg open:flex",
        "sm:m-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-2rem)] sm:rounded-2xl",
        size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
        "backdrop:bg-stone-950/40 backdrop:backdrop-blur-[1px]",
        "transition-[opacity,translate] duration-200 ease-out starting:open:translate-y-4 starting:open:opacity-0",
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border-soft px-5 py-4 sm:px-6">
        <div className="min-w-0 space-y-1">
          <h2 id={titleId} className="text-base font-semibold tracking-tight text-stone-900">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-[13px] leading-relaxed text-stone-600">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="-mt-1 -mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 text-sm leading-relaxed text-stone-700 sm:px-6">
        {children}
      </div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-border-soft px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}
