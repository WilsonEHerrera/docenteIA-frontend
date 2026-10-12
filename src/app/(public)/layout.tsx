"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { GaugeIcon, SparkIcon, UserCheckIcon } from "@/components/ui/icons";
import { returnPathFromLocation } from "@/lib/auth/return-path";
import { useAuth } from "@/providers/AuthProvider";

const PRINCIPLE = [
  { Icon: GaugeIcon, title: "La automatización calcula y avisa", text: "Asistencia, promedios y alertas de fallas." },
  { Icon: SparkIcon, title: "La IA interpreta y sugiere", text: "Notas, retroalimentación y cuestionarios propuestos." },
  { Icon: UserCheckIcon, title: "Tú decides", text: "Nada se publica sin tu revisión y aprobación." },
];

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Already signed in (or just signed in): go where the user was headed, never off-site.
    if (status === "authenticated") router.replace(returnPathFromLocation());
  }, [status, router]);

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-[44%] max-w-xl flex-col justify-between border-r border-border-soft bg-white p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-base font-bold tracking-tight text-stone-900">DocentIA</span>
        </div>

        <div className="space-y-10">
          <p className="max-w-md text-[1.75rem] leading-tight font-bold tracking-tight text-balance text-stone-900 xl:text-3xl">
            Menos tiempo en tareas repetitivas. Tu criterio, siempre al mando.
          </p>
          <ol className="space-y-5">
            {PRINCIPLE.map(({ Icon, title, text }, index) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-stone-50 text-stone-700">
                  <Icon />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-stone-900">
                    <span className="mr-2 font-mono text-xs font-medium text-stone-400">0{index + 1}</span>
                    {title}
                  </p>
                  <p className="text-[13px] leading-relaxed text-stone-600">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="font-mono text-[11px] tracking-wide text-stone-400 uppercase">Plataforma para docentes</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center justify-center gap-2.5 lg:hidden">
            <BrandMark />
            <span className="text-lg font-bold tracking-tight text-stone-900">DocentIA</span>
          </div>
          {children}
          <p className="text-center text-xs leading-relaxed text-stone-500 lg:hidden">
            La automatización calcula y avisa, la IA interpreta y sugiere, tú decides.
          </p>
        </div>
      </main>
    </div>
  );
}
