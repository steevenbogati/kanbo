"use client";

import { useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { addComment, deleteComment } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { Avatar } from "@/components/user-menu";
import type { Profile, TaskComment } from "@/lib/types/database";

export function Comments({
  taskId,
  comments,
  team,
  onChanged,
}: {
  taskId: string;
  comments: TaskComment[];
  team: Profile[];
  onChanged: () => void;
}) {
  const { userId, isAdmin } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  function nameOf(id: string) {
    const person = team.find((member) => member.id === id);
    return person?.full_name || person?.username || "Alguien";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = String(new FormData(event.currentTarget).get("body") ?? "");

    setPending(true);
    const result = await addComment(taskId, userId, body);
    setPending(false);

    if (result.error) toast.error(result.error);
    else {
      formRef.current?.reset();
      onChanged();
    }
  }

  async function remove(id: string) {
    const result = await deleteComment(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Comentario borrado");
      onChanged();
    }
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
            const isMine = comment.author_id === userId;

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
                    onClick={() => void remove(comment.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form ref={formRef} onSubmit={onSubmit} className="space-y-2 border-t pt-4">
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
          <Button type="submit" className="h-10" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Comentar
          </Button>
        </div>
      </form>
    </div>
  );
}
