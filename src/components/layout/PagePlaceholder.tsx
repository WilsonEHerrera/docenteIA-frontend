import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { ClockIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";

interface PagePlaceholderProps {
  title: string;
  description: string;
  /** What the screen will offer once the backend supports it. Informative only, no actions. */
  upcoming?: string[];
  icon?: ReactNode;
}

/** Body for routes whose backend is still `planned`: says so plainly and offers no simulated actions. */
export function PagePlaceholder({ title, description, upcoming, icon }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} status={<Badge variant="neutral">Próximamente</Badge>} />
      <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 sm:p-10">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-border-soft bg-stone-50 text-stone-500">
            {icon ?? <ClockIcon width={22} height={22} />}
          </span>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-stone-900">Esta sección aún no está disponible</h2>
            <p className="text-[13px] leading-relaxed text-pretty text-stone-600">
              La conexión con el servidor para esta funcionalidad está en desarrollo. Cuando esté lista, la encontrarás
              en esta misma sección.
            </p>
          </div>
          {upcoming && upcoming.length > 0 && (
            <ul className="w-full space-y-2 pt-2 text-left">
              {upcoming.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-border-soft bg-stone-50/60 px-4 py-3 text-[13px] text-stone-700"
                >
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-stone-400" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
