"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/dates";
import { deleteAttachment, registerAttachment } from "@/app/actions/tasks";
import type { TaskAttachment } from "@/lib/types/database";

const MAX_SIZE = 25 * 1024 * 1024;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Keeps only characters that are safe in a Storage path. */
function safeName(name: string): string {
  return name
    .normalize("NFD") // splits accents off, then the next line drops them
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-80);
}

export function Attachments({
  taskId,
  files,
  currentUserId,
  isAdmin,
}: {
  taskId: string;
  files: (TaskAttachment & { url: string | null })[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // The file goes straight from the browser to Supabase Storage; the row is
  // saved afterwards through a server action.
  async function upload(file: File) {
    if (file.size > MAX_SIZE) {
      toast.error("El archivo pasa de 25 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${taskId}/${crypto.randomUUID()}-${safeName(file.name)}`;

    const { error } = await supabase.storage.from("task-files").upload(path, file);

    if (error) {
      setUploading(false);
      toast.error(`No se pudo subir el archivo: ${error.message}`);
      return;
    }

    const result = await registerAttachment({
      taskId,
      storagePath: path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    });

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result.error) toast.error(result.error);
    else {
      toast.success("Archivo subido");
      router.refresh();
    }
  }

  function remove(file: TaskAttachment) {
    startTransition(async () => {
      const result = await deleteAttachment(file.id, taskId, file.storage_path);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Archivo borrado");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id} className="flex items-center gap-2 rounded-lg border p-2">
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{file.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {humanSize(file.file_size)} · {formatDateTime(file.created_at)}
              </p>
            </div>
            {file.url && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Descargar ${file.file_name}`}
                nativeButton={false}
                render={<a href={file.url} target="_blank" rel="noopener noreferrer" />}
              >
                <Download className="size-4" />
              </Button>
            )}
            {(file.uploaded_by === currentUserId || isAdmin) && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Borrar ${file.file_name}`}
                onClick={() => remove(file)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </li>
        ))}
        {files.length === 0 && <li className="text-sm text-muted-foreground">Sin archivos.</li>}
      </ul>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {uploading ? "Subiendo…" : "Adjuntar archivo"}
      </Button>
      <p className="text-xs text-muted-foreground">Hasta 25 MB por archivo.</p>
    </div>
  );
}
