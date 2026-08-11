"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { idleState } from "@/lib/action-state";
import { addComment, deleteComment } from "@/app/actions/tasks";
import { Avatar } from "@/components/user-menu";
import type { Profile, TaskComment } from "@/lib/types/database";

function SendButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-10" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
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
    return person?.full_name || person?.username || "Alguien";
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteComment(id, taskId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Comentario borrado");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <MessageSquare className="size-4" />
          Todavía no hay comentarios.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {comments.map((comment) => {
            const author = nameOf(comment.author_id);
            const isMine = comment.author_id === currentUserId;

            return (
              <li key={comment.id} className="group flex gap-2.5">
                <Avatar name={author} className="mt-0.5 size-7 text-[10px]" />

                <div className="min-w-0 flex-1 rounded-lg rounded-tl-none bg-muted/60 px-3 py-2">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-semibold">{isMine ? "Tú" : author}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(comment.created_at)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed">
                    {comment.body}
                  </p>
                </div>

                {(isMine || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Borrar el comentario de ${author}`}
                    className="mt-0.5 text-muted-foreground opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => remove(comment.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="space-y-2 border-t pt-4">
        <input type="hidden" name="task_id" value={taskId} />
        <label htmlFor="comment-body" className="sr-only">
          Escribe un comentario
        </label>
        <Textarea
          id="comment-body"
          name="body"
          rows={3}
          placeholder="Escribe un comentario…"
          className="resize-y text-base"
          required
        />
        <div className="flex justify-end">
          <SendButton />
        </div>
      </form>
    </div>
  );
}
