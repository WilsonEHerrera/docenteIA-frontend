import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { ChartIcon } from "@/components/ui/icons";

export default function Page() {
  return (
    <PagePlaceholder
      title="Reportes"
      description="Consulta el rendimiento y la asistencia por curso."
      icon={<ChartIcon width={22} height={22} />}
      upcoming={[
        "Rendimiento por curso y por actividad, calculado por el sistema.",
        "Asistencia acumulada y estudiantes cerca del límite de fallas.",
        "Exportación de reportes en PDF y Excel.",
      ]}
    />
  );
}
