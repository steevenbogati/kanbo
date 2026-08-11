import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { emailEnabled, sendEmail } from "@/lib/email";
import { formatDate, todayISO } from "@/lib/dates";
import { PRIORITY_LABEL } from "@/lib/labels";

/**
 * Daily reminder digest: one email per person listing their tasks due today and
 * the ones already overdue. Protected by CRON_SECRET because it runs without a
 * logged-in user, and it uses the service-role client for the same reason.
 *
 * Each task is only reported once per day (due_notified_on).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    request.nextUrl.searchParams.get("clave");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayISO();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, assignee_id, status, due_notified_on")
    .neq("status", "done")
    .not("assignee_id", "is", null)
    .not("due_date", "is", null)
    .lte("due_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pending = (tasks ?? []).filter((task) => task.due_notified_on !== today);
  if (pending.length === 0) {
    return NextResponse.json({ enviados: 0, mensaje: "No había nada que avisar." });
  }

  const { data: people } = await supabase.from("profiles").select("id, email, full_name");
  const byId = new Map((people ?? []).map((person) => [person.id, person]));

  // One email per person, not one per task.
  const groups = new Map<string, typeof pending>();
  for (const task of pending) {
    const list = groups.get(task.assignee_id!) ?? [];
    list.push(task);
    groups.set(task.assignee_id!, list);
  }

  let sentCount = 0;
  let previewCount = 0;

  for (const [assigneeId, list] of groups) {
    const person = byId.get(assigneeId);
    if (!person?.email) continue;

    const overdue = list.filter((task) => task.due_date! < today);
    const dueToday = list.filter((task) => task.due_date === today);

    const lines: string[] = [];
    if (overdue.length > 0) {
      lines.push("<strong>Vencidas:</strong>");
      lines.push(
        ...overdue.map(
          (task) =>
            `• ${task.title} — era para el ${formatDate(task.due_date)} (${PRIORITY_LABEL[task.priority]})`,
        ),
      );
    }
    if (dueToday.length > 0) {
      lines.push("<strong>Vencen hoy:</strong>");
      lines.push(
        ...dueToday.map((task) => `• ${task.title} (${PRIORITY_LABEL[task.priority]})`),
      );
    }

    const result = await sendEmail({
      to: person.email,
      subject:
        overdue.length > 0
          ? `Tienes ${overdue.length + dueToday.length} tarea(s) por atender`
          : `Hoy vencen ${dueToday.length} tarea(s)`,
      heading: `Hola ${person.full_name?.split(" ")[0] ?? ""}, esto es lo urgente`,
      lines,
      linkPath: "/mi-dia",
    });

    if (result === "preview") previewCount += list.length;

    if (result === "sent") {
      sentCount += list.length;
      // Marked only after a real send, so nothing is silently skipped.
      await supabase
        .from("tasks")
        .update({ due_notified_on: today })
        .in(
          "id",
          list.map((task) => task.id),
        );
    }
  }

  return NextResponse.json({
    personas: groups.size,
    enviados: sentCount,
    vista_previa: previewCount,
    mensaje: emailEnabled()
      ? undefined
      : "Los correos están apagados (falta RESEND_API_KEY): revisa la terminal para ver el contenido.",
  });
}
