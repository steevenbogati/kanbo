"use client";

import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { Profile, Project, TaskOverview } from "@/lib/types/database";

export function EditTaskButton({
  task,
  team,
  projects,
  isAdmin,
}: {
  task: TaskOverview;
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  return (
    <TaskDialog
      task={task}
      team={team}
      projects={projects}
      isAdmin={isAdmin}
      trigger={
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Pencil className="size-3.5" />
          Editar
        </DialogTrigger>
      }
    />
  );
}
