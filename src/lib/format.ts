const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" });

/** ISO 8601 UTC -> local "dd/mm/aaaa, hh:mm"; "—" for null or invalid values. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date);
}
