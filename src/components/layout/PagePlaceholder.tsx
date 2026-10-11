import { EmptyState } from "@/components/ui/EmptyState";

interface PagePlaceholderProps {
  title: string;
  description: string;
}

/** Temporary body for routes whose screen is built in a later phase. */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
      <EmptyState title="Pantalla en construcción" description={description} />
    </div>
  );
}
