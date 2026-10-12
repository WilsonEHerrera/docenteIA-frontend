import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  /** Status badge shown next to the title. */
  status?: ReactNode;
  /** Small mono line under the title (ids, periods). */
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, back, status, meta, actions }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {back && <BackLink href={back.href} label={back.label} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl leading-tight font-bold tracking-tight text-balance text-stone-900 sm:text-[1.75rem]">
              {title}
            </h1>
            {status}
          </div>
          {meta && <p className="font-mono text-[11px] break-all text-stone-500">{meta}</p>}
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-pretty text-stone-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-1 text-[13px] font-medium text-stone-600 transition-colors hover:text-stone-900"
    >
      <ChevronLeftIcon width={16} height={16} />
      {label}
    </Link>
  );
}

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
}

/** h2 for sections inside a page (admin sub-pages, lists under a form). */
export function SectionHeader({ title, description, actions, id }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h2 id={id} className="text-lg font-semibold tracking-tight text-stone-900">
          {title}
        </h2>
        {description && <p className="text-[13px] leading-relaxed text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
