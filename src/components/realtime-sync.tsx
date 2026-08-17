"use client";

import { useEffect } from "react";

import { supabase } from "@/lib/supabase/browser";

/** One low-cost subscription keeps every open Kanbo tab in sync. */
export function RealtimeSync() {
  useEffect(() => {
    const channel = supabase()
      .channel("kanbo-workspace")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, notify)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_comments" }, notify)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_activity" }, notify)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, notify)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_checklist" }, notify)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_time_entries" }, notify)
      .subscribe();

    return () => {
      void supabase().removeChannel(channel);
    };
  }, []);

  return null;
}

function notify() {
  window.dispatchEvent(new Event("kanbo:refresh"));
}
