"use client";

import { useEffect, useRef, useState } from "react";

type State<T> = { data: T | null; loading: boolean; error: string | null };

/**
 * Loads data in the browser and gives back a `refresh()` to call after saving
 * something. Replaces what the server used to do on every page load.
 *
 * `deps` are the values the query depends on (the filters, for example); when
 * one changes, the data is fetched again.
 */
export function useData<T>(
  load: () => Promise<T>,
  deps: unknown[] = [],
): State<T> & { refresh: () => void } {
  const key = JSON.stringify(deps);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  // Keeps the newest closure without making it a dependency of the fetch.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let alive = true;

    void (async () => {
      try {
        const data = await loadRef.current();
        if (alive) setState({ data, loading: false, error: null });
      } catch (cause) {
        if (alive) {
          setState({
            data: null,
            loading: false,
            error: cause instanceof Error ? cause.message : "No se pudieron cargar los datos.",
          });
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [key, version]);

  // Supabase Realtime tells every open screen to reload its own query. This
  // keeps the hook generic: boards, lists and detail screens all stay current.
  useEffect(() => {
    const refreshFromWorkspace = () => setVersion((current) => current + 1);
    window.addEventListener("kanbo:refresh", refreshFromWorkspace);
    return () => window.removeEventListener("kanbo:refresh", refreshFromWorkspace);
  }, []);

  return { ...state, refresh: () => setVersion((current) => current + 1) };
}
