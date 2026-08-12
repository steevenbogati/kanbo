/**
 * Manda los correos del equipo. Corre en GitHub Actions cada media hora (o a
 * mano con `npm run notificar`), porque la app ya no tiene servidor.
 *
 * Hace dos cosas:
 *   1. Avisa a quien le acaban de asignar una tarea (una sola vez por tarea).
 *   2. Manda un resumen diario a cada persona con lo que vence hoy y lo vencido.
 *
 * Si falta RESEND_API_KEY no envía nada: escribe en pantalla lo que habría
 * enviado, para poder revisarlo.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const timeZone = "America/Guayaquil";

if (!url || !secret) {
  console.error("Faltan las variables de Supabase (URL y clave secreta).");
  process.exit(1);
}

const emailOn = Boolean(resendKey && from);
const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PRIORITY = { high: "Alta", medium: "Media", low: "Baja" };

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function formatDate(iso) {
  if (!iso) return "sin fecha";
  return new Intl.DateTimeFormat("es-EC", { day: "numeric", month: "short" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

async function send({ to, subject, heading, lines, linkPath }) {
  const link = `${appUrl}${linkPath ?? ""}`;

  if (!emailOn) {
    console.info(
      [
        "",
        "── Correo en vista previa (falta RESEND_API_KEY, no se envió nada) ──",
        `Para:    ${to}`,
        `Asunto:  ${subject}`,
        `Título:  ${heading}`,
        ...lines.map((line) => `         ${line.replace(/<[^>]+>/g, "")}`),
        `Enlace:  ${link}`,
        "────────────────────────────────────────────────────────────────────",
      ].join("\n"),
    );
    return "preview";
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:520px">
      <h1 style="font-size:18px;margin:0 0 16px">${heading}</h1>
      ${lines.map((line) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${line}</p>`).join("")}
      <p style="margin:24px 0 0">
        <a href="${link}" style="background:#0d9488;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;display:inline-block">Abrir en Kanbo</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">Este correo lo envía Kanbo automáticamente. No hace falta responder.</p>
    </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!response.ok) {
    console.error(`No se pudo enviar a ${to}: ${await response.text()}`);
    return "error";
  }
  return "sent";
}

// ── Quién es quién ───────────────────────────────────────────────────────────
const { data: people } = await supabase.from("profiles").select("id, full_name, username, email");
const byId = new Map((people ?? []).map((person) => [person.id, person]));

function contactOf(id) {
  const person = byId.get(id);
  return person?.email ? person : null;
}

// ── 1. Tareas recién asignadas ───────────────────────────────────────────────
const { data: fresh } = await supabase
  .from("tasks")
  .select("id, title, assignee_id, created_by, priority, due_date, project_id, assignment_notified_at")
  .not("assignee_id", "is", null)
  .is("assignment_notified_at", null)
  .neq("status", "done");

const { data: projects } = await supabase.from("projects").select("id, name, client_name");
const projectById = new Map((projects ?? []).map((project) => [project.id, project]));

let assignmentCount = 0;

for (const task of fresh ?? []) {
  // Si te asignaste la tarea a ti mismo no hace falta avisarte.
  if (task.assignee_id === task.created_by) {
    await supabase
      .from("tasks")
      .update({ assignment_notified_at: new Date().toISOString() })
      .eq("id", task.id);
    continue;
  }

  const person = contactOf(task.assignee_id);
  if (!person) continue;

  const project = task.project_id ? projectById.get(task.project_id) : null;

  const result = await send({
    to: person.email,
    subject: `Nueva tarea: ${task.title}`,
    heading: "Te asignaron una tarea",
    lines: [
      `<strong>${task.title}</strong>`,
      project ? `Proyecto: ${project.name}` : "Sin proyecto",
      `Prioridad: ${PRIORITY[task.priority]}`,
      task.due_date ? `Entrega: ${formatDate(task.due_date)}` : "Sin fecha de entrega",
    ],
    linkPath: `/tarea/?id=${task.id}`,
  });

  if (result === "sent") {
    assignmentCount += 1;
    await supabase
      .from("tasks")
      .update({ assignment_notified_at: new Date().toISOString() })
      .eq("id", task.id);
  }
}

// ── 2. Resumen de vencimientos ───────────────────────────────────────────────
const { data: due } = await supabase
  .from("tasks")
  .select("id, title, due_date, priority, assignee_id, due_notified_on")
  .neq("status", "done")
  .not("assignee_id", "is", null)
  .not("due_date", "is", null)
  .lte("due_date", today);

const pending = (due ?? []).filter((task) => task.due_notified_on !== today);

const groups = new Map();
for (const task of pending) {
  const list = groups.get(task.assignee_id) ?? [];
  list.push(task);
  groups.set(task.assignee_id, list);
}

let digestCount = 0;

for (const [assigneeId, list] of groups) {
  const person = contactOf(assigneeId);
  if (!person) continue;

  const overdue = list.filter((task) => task.due_date < today);
  const dueToday = list.filter((task) => task.due_date === today);

  const lines = [];
  if (overdue.length > 0) {
    lines.push("<strong>Vencidas:</strong>");
    lines.push(
      ...overdue.map(
        (task) => `• ${task.title} — era para el ${formatDate(task.due_date)} (${PRIORITY[task.priority]})`,
      ),
    );
  }
  if (dueToday.length > 0) {
    lines.push("<strong>Vencen hoy:</strong>");
    lines.push(...dueToday.map((task) => `• ${task.title} (${PRIORITY[task.priority]})`));
  }

  const result = await send({
    to: person.email,
    subject:
      overdue.length > 0
        ? `Tienes ${overdue.length + dueToday.length} tarea(s) por atender`
        : `Hoy vencen ${dueToday.length} tarea(s)`,
    heading: `Hola ${person.full_name?.split(" ")[0] ?? ""}, esto es lo urgente`,
    lines,
    linkPath: "/mi-dia/",
  });

  if (result === "sent") {
    digestCount += list.length;
    await supabase
      .from("tasks")
      .update({ due_notified_on: today })
      .in(
        "id",
        list.map((task) => task.id),
      );
  }
}

console.log(
  emailOn
    ? `Listo. Avisos de asignación: ${assignmentCount}. Tareas incluidas en resúmenes: ${digestCount}.`
    : "Los correos están apagados (falta RESEND_API_KEY): arriba está lo que se habría enviado.",
);
