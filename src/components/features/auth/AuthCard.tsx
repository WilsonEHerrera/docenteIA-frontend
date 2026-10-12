import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footerLink: { href: string; label: string };
}

/** Shared frame for login, password recovery and reset. */
export function AuthCard({ title, description, children, footerLink }: AuthCardProps) {
  return (
    <div className="space-y-5">
      <Card padding="lg" spacing="lg">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
          {description && <p className="text-sm leading-relaxed text-stone-600">{description}</p>}
        </div>
        {children}
      </Card>
      <p className="text-center text-[13px]">
        <Link
          href={footerLink.href}
          className="rounded-md px-1 py-1 font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition-colors hover:text-stone-900 hover:decoration-stone-900"
        >
          {footerLink.label}
        </Link>
      </p>
    </div>
  );
}
