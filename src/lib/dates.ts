/** Date helpers. All output is Spanish and uses the Ecuador time zone. */

const TIME_ZONE = "America/Guayaquil";

/** Today in Ecuador, as YYYY-MM-DD (same shape as a Postgres `date`). */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** ISO timestamp for "N days ago", used by the weekly counters. */
export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** "12 mar" or "12 mar 2025" when the year is not the current one. */
export function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const date = new Date(`${iso}T12:00:00`);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("es-EC", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-EC", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** "Vence hoy", "Vencida hace 3 días", "En 5 días"… */
export function dueLabel(dueDate: string | null): { text: string; tone: "late" | "today" | "soon" | "calm" } {
  if (!dueDate) return { text: "Sin fecha", tone: "calm" };

  const diff = daysBetween(todayISO(), dueDate);

  if (diff < 0) {
    const days = Math.abs(diff);
    return { text: days === 1 ? "Vencida ayer" : `Vencida hace ${days} días`, tone: "late" };
  }
  if (diff === 0) return { text: "Vence hoy", tone: "today" };
  if (diff === 1) return { text: "Vence mañana", tone: "soon" };
  if (diff <= 3) return { text: `Vence en ${diff} días`, tone: "soon" };
  return { text: formatDate(dueDate), tone: "calm" };
}

/** "3,5 días" for the dashboard averages. */
export function formatDays(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  const text = rounded.toLocaleString("es-EC", { maximumFractionDigits: 1 });
  return `${text} ${rounded === 1 ? "día" : "días"}`;
}
