"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** Searches straight into the list view, where the filters live. */
export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const term = value.trim();
        router.push(term ? `/lista?buscar=${encodeURIComponent(term)}` : "/lista");
      }}
      className={className}
    >
      <label htmlFor="buscar-tareas" className="sr-only">
        Buscar tareas
      </label>
      <div className="relative">
        <input
          id="buscar-tareas"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar una tarea…"
          className="h-11 w-full rounded-xl border border-transparent bg-card pl-4 pr-11 text-sm shadow-xs outline-none transition-colors duration-150 placeholder:text-muted-foreground/80 hover:border-border focus-visible:border-ring"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="size-4" />
        </button>
      </div>
    </form>
  );
}
