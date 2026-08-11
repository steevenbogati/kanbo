import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

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
import { PRIORITY_LABEL, PRIORITY_STYLE, RECURRENCE_LABEL, STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Attachments } from "@/components/tasks/attachments";
import { Comments } from "@/components/tasks/comments";
import { TaskMenu } from "@/components/tasks/task-menu";
import { EditTaskButton } from "@/components/tasks/edit-task-button";

export const metadata: Metadata = { title: "Tarea · Kanbo" };

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
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/tablero" />}>
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <div className="flex items-center gap-1">
          <EditTaskButton task={task} team={team} projects={projects} isAdmin={isAdmin} />
          <TaskMenu task={task} isAdmin={isAdmin} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border px-2 py-0.5">{STATUS_LABEL[task.status]}</span>
            <span className={cn("rounded-full border px-2 py-0.5", PRIORITY_STYLE[task.priority])}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            {task.recurrence !== "none" && (
              <span className="rounded-full border px-2 py-0.5">
                {RECURRENCE_LABEL[task.recurrence]}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {task.description && (
            <p className="whitespace-pre-wrap text-sm">{task.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Responsable</dt>
              <dd>{task.assignee_name || "Sin responsable"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Proyecto</dt>
              <dd>
                {task.project_name
                  ? task.client_name
                    ? `${task.project_name} · ${task.client_name}`
                    : task.project_name
                  : "Sin proyecto"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Entrega</dt>
              <dd className={cn(task.is_overdue && "text-red-600 dark:text-red-400")}>
                {formatDate(task.due_date)}
                {task.is_overdue && " (vencida)"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Creada por</dt>
              <dd>{task.created_by_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tiempo de entrega</dt>
              <dd>
                {task.duration_days !== null
                  ? formatDays(task.duration_days)
                  : task.started_at
                    ? "En curso"
                    : "Sin empezar"}
              </dd>
            </div>
            {task.external_url && (
              <div>
                <dt className="text-xs text-muted-foreground">Enlace</dt>
                <dd>
                  <a
                    href={task.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    Abrir
                    <ExternalLink className="size-3.5" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Archivos</CardTitle>
        </CardHeader>
        <CardContent>
          <Attachments taskId={task.id} files={files} currentUserId={userId} isAdmin={isAdmin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Comments
            taskId={task.id}
            comments={comments}
            team={team}
            currentUserId={userId}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bitácora</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {activity.map((entry) => {
              const who = team.find((member) => member.id === entry.actor_id);
              return (
                <li key={entry.id} className="flex flex-wrap gap-x-2 text-muted-foreground">
                  <span className="text-foreground">
                    {entry.from_status
                      ? `${STATUS_LABEL[entry.from_status]} → ${STATUS_LABEL[entry.to_status]}`
                      : `Creada en ${STATUS_LABEL[entry.to_status]}`}
                  </span>
                  <span>{who?.full_name || who?.email || "alguien"}</span>
                  <span>·</span>
                  <span>{formatDateTime(entry.created_at)}</span>
                </li>
              );
            })}
            {activity.length === 0 && <li className="text-muted-foreground">Sin movimientos.</li>}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
