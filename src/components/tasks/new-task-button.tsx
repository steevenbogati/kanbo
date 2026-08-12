"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { Profile, Project } from "@/lib/types/database";

export function NewTaskButton({
  team,
  projects,
  onSaved,
}: {
  team: Profile[];
  projects: Project[];
  onSaved: () => void;
}) {
  return (
    <TaskDialog
      team={team}
      projects={projects}
      onSaved={onSaved}
      trigger={
        <DialogTrigger render={<Button className="h-10 px-3.5 text-[13px] font-semibold" />}>
          <Plus className="size-4" />
          Nueva tarea
        </DialogTrigger>
      }
    />
  );
}
