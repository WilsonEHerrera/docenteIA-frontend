import { Button } from "./Button";

interface PagerProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pager({ page, limit, total, onChange }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      <p className="font-mono text-xs text-stone-600">
        Página {page} de {pages} · {total} en total
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
