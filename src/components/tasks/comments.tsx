"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { idleState } from "@/lib/action-state";
import { addComment, deleteComment } from "@/app/actions/tasks";
import { initials } from "@/components/user-menu";
import type { Profile, TaskComment } from "@/lib/types/database";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Comentar
    </Button>
  );
}

export function Comments({
  taskId,
  comments,
  team,
  currentUserId,
  isAdmin,
}: {
  taskId: string;
  comments: TaskComment[];
  team: Profile[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [state, formAction] = useActionState(addComment, idleState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, router]);

  function nameOf(id: string) {
    const person = team.find((member) => member.id === id);
    return person?.full_name || person?.email || "Alguien";
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id, taskId);
      if (result.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-2.5">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
              {initials(nameOf(comment.author_id), "?")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{nameOf(comment.author_id)}</span>
                {" · "}
                {formatDateTime(comment.created_at)}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{comment.body}</p>
            </div>
            {(comment.author_id === currentUserId || isAdmin) && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Borrar comentario"
                onClick={() => remove(comment.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-muted-foreground">Todavía no hay comentarios.</li>
        )}
      </ul>

      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="task_id" value={taskId} />
        <Textarea name="body" rows={3} placeholder="Escribe un comentario…" required />
        <div className="flex justify-end">
          <SendButton />
        </div>
      </form>
    </div>
  );
}
