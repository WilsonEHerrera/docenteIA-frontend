import { Badge } from "@/components/ui/Badge";

interface RiskChipProps {
  absences: number;
  maxAbsences: number;
}

/** Amber from 80 % of the absence limit, red once exceeded (docs/DESIGN.md §6). */
export function RiskChip({ absences, maxAbsences }: RiskChipProps) {
  const exceeded = absences > maxAbsences;
  return (
    <Badge variant={exceeded ? "danger" : "warning"}>
      {exceeded ? "Límite superado" : "Cerca del límite"} · {absences}/{maxAbsences}
    </Badge>
  );
}
