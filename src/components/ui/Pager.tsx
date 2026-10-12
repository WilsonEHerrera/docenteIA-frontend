import { Button } from "./Button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface PagerProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pager({ page, limit, total, onChange }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-mono text-xs text-stone-600">
        Página {page} de {pages} · {total} en total
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeftIcon />
          Anterior
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Siguiente
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}
