"use client";

import { useState } from "react";
import { EDUCATION_QUOTES, pickQuoteIndex, quoteCaption } from "@/lib/education-quotes";
import { cn } from "@/lib/cn";

/**
 * One education quote, chosen when the view mounts (reload or a new visit picks another),
 * never on re-render. Home only renders on the client, behind the session gate, so the random
 * pick cannot cause a hydration mismatch.
 */
export function EducationQuote({ className }: { className?: string }) {
  const [index] = useState(() => (typeof window === "undefined" ? 0 : pickQuoteIndex()));
  const quote = EDUCATION_QUOTES[index];
  const literal = quote.kind !== "parafrasis";

  return (
    <figure className={cn("relative space-y-3", className)}>
      <blockquote className="text-[15px] leading-relaxed font-medium text-pretty text-stone-800 sm:text-base">
        {literal ? `«${quote.text.replace(/\.$/, "")}».` : quote.text}
      </blockquote>
      <figcaption className="text-xs leading-relaxed text-stone-500">{quoteCaption(quote)}</figcaption>
    </figure>
  );
}
