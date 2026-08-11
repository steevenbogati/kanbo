"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileArchive,
  FileImage,
  FileText,
  FileVideo,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
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

/** The icon says what kind of file it is without opening it. */
function iconFor(mimeType: string, fileName: string) {
  const name = fileName.toLowerCase();
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return FileArchive;
  return FileText;
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
      if (inputRef.current) inputRef.current.value = "";
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
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => {
            const Icon = iconFor(file.mime_type, file.file_name);

            return (
              <li
                key={file.id}
                className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-150 hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{file.file_name}</p>
                  <p className="nums text-[11px] text-muted-foreground">
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
                    className="text-muted-foreground opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => remove(file)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Paperclip className="size-4" />
          )}
          {uploading ? "Subiendo…" : files.length > 0 ? "Adjuntar otro" : "Adjuntar archivo"}
        </Button>
        <p className="text-[12px] text-muted-foreground">
          {files.length === 0 ? "Sin archivos todavía. " : ""}Hasta 25 MB por archivo.
        </p>
      </div>
    </div>
  );
}
