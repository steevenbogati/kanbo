import type { TaskOverview } from "@/lib/types/database";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function downloadTasksCsv(tasks: TaskOverview[]) {
  const headers = ["Título", "Responsable", "Proyecto", "Prioridad", "Estado", "Entrega", "Horas estimadas", "Días de entrega", "Enlace"];
  const rows = tasks.map((task) => [task.title, task.assignee_name ?? "Sin asignar", task.project_name ?? "Sin proyecto", task.priority, task.status, task.due_date ?? "", task.estimated_hours, task.duration_days ?? "", task.external_url ?? ""]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kanbo-tareas-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
