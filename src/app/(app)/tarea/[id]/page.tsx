import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, History } from "lucide-react";

import { requireSession } from "@/lib/auth";
import {
  getActivity,
  getAttachments,
  getComments,
  getProjects,
  getTask,
  getTeam,
} from "@/lib/queries";
import { formatDate, formatDateTime, formatDays } from "@/lib/dates";
import {
  PRIORITY_CHIP,
  PRIORITY_LABEL,
  RECURRENCE_LABEL,
  STATUS_CHIP,
  STATUS_DOT,
  STATUS_LABEL,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/tasks/attachments";
import { Comments } from "@/components/tasks/comments";
import { TaskMenu } from "@/components/tasks/task-menu";
import { EditTaskButton } from "@/components/tasks/edit-task-button";

export const metadata: Metadata = { title: "Tarea" };

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card shadow-xs">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {action}
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] font-medium">{children}</dd>
    </div>
  );
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, isAdmin } = await requireSession();

  const task = await getTask(id);
  if (!task) notFound();

  const [comments, files, activity, team, projects] = await Promise.all([
    getComments(id),
    getAttachments(id),
    getActivity(id),
    getTeam(),
    getProjects(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/tablero" />}>
          <ArrowLeft className="size-4" />
          Volver al tablero
        </Button>
        <div className="flex items-center gap-1.5">
          <EditTaskButton task={task} team={team} projects={projects} isAdmin={isAdmin} />
          <TaskMenu task={task} isAdmin={isAdmin} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
        {/* Main column */}
        <div className="space-y-4">
          <header className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  STATUS_CHIP[task.status],
                )}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[task.status])} />
                {STATUS_LABEL[task.status]}
              </span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  PRIORITY_CHIP[task.priority],
                )}
              >
                Prioridad {PRIORITY_LABEL[task.priority].toLowerCase()}
              </span>
              {task.recurrence !== "none" && (
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                  {RECURRENCE_LABEL[task.recurrence]}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-[22px] font-semibold leading-snug tracking-tight">
              {task.title}
            </h1>

            {task.description ? (
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground">
                {task.description}
              </p>
            ) : (
              <p className="mt-3 text-[14px] italic text-muted-foreground">Sin descripción.</p>
            )}

            {task.external_url && (
              <a
                href={task.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors duration-150 hover:bg-muted"
              >
                Abrir enlace
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </header>

          <Panel title="Archivos">
            <Attachments taskId={task.id} files={files} currentUserId={userId} isAdmin={isAdmin} />
          </Panel>

          <Panel title={`Comentarios${comments.length > 0 ? ` (${comments.length})` : ""}`}>
            <Comments
              taskId={task.id}
              comments={comments}
              team={team}
              currentUserId={userId}
              isAdmin={isAdmin}
            />
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-xl border bg-card px-4 py-2 shadow-xs">
            <dl className="divide-y">
              <Meta label="Responsable">{task.assignee_name || "Sin asignar"}</Meta>
              <Meta label="Proyecto">
                {task.project_name ? (
                  <span className="block truncate">
                    {task.project_name}
                    {task.client_name && (
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        {task.client_name}
                      </span>
                    )}
                  </span>
                ) : (
                  "Sin proyecto"
                )}
              </Meta>
              <Meta label="Entrega">
                <span className={cn(task.is_overdue && "text-high")}>
                  {formatDate(task.due_date)}
                  {task.is_overdue && " · vencida"}
                </span>
              </Meta>
              <Meta label="Tiempo de entrega">
                {task.duration_days !== null
                  ? formatDays(task.duration_days)
                  : task.started_at
                    ? "En curso"
                    : "Sin empezar"}
              </Meta>
              <Meta label="Creada por">{task.created_by_name || "—"}</Meta>
            </dl>
          </section>

          <Panel title="Bitácora">
            {activity.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Sin movimientos.</p>
            ) : (
              <ol className="relative space-y-3.5 pl-5">
                {/* Connector line behind the dots */}
                <span aria-hidden className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" />
                {activity.map((entry) => {
                  const who = team.find((member) => member.id === entry.actor_id);
                  return (
                    <li key={entry.id} className="relative">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute -left-5 top-1 size-[11px] rounded-full ring-2 ring-card",
                          STATUS_DOT[entry.to_status],
                        )}
                      />
                      <p className="text-[13px] font-medium leading-snug">
                        {entry.from_status
                          ? `${STATUS_LABEL[entry.from_status]} → ${STATUS_LABEL[entry.to_status]}`
                          : `Creada en ${STATUS_LABEL[entry.to_status]}`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {who?.full_name || who?.username || "alguien"} · {formatDateTime(entry.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="mt-4 flex items-start gap-1.5 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
              <History className="mt-px size-3.5 shrink-0" />
              La bitácora la escribe la base de datos: nadie puede editarla.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
