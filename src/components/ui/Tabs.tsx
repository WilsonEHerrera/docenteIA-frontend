"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  className?: string;
}

/** Segmented tabs (controlled). The caller renders the active content. */
export function Tabs({ items, value, onChange, className, ...props }: TabsProps) {
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1", className)}
    >
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`${baseId}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "h-9 shrink-0 cursor-pointer rounded-lg px-4 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 sm:h-8",
              active ? "bg-white text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
