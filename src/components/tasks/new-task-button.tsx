"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { Profile, Project } from "@/lib/types/database";

export function NewTaskButton({
  team,
  projects,
  isAdmin,
}: {
  team: Profile[];
  projects: Project[];
  isAdmin: boolean;
}) {
  return (
    <TaskDialog
      team={team}
      projects={projects}
      isAdmin={isAdmin}
      trigger={
        <DialogTrigger render={<Button size="lg" />}>
          <Plus className="size-4" />
          Nueva tarea
        </DialogTrigger>
      }
    />
  );
}
