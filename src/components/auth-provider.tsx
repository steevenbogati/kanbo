"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/browser";
import type { Profile } from "@/lib/types/database";

type AuthState = {
  userId: string;
  profile: Profile;
  isAdmin: boolean;
  mfaRequired: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

/** Reads the session and the profile of whoever is signed in. */
async function readSession(): Promise<AuthState | null> {
  const {
    data: { session },
  } = await supabase().auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabase()
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile) {
    // The account exists but has no profile row: signing out avoids a broken shell.
    await supabase().auth.signOut();
    return null;
  }

  const { data: assurance } = await supabase().auth.mfa.getAuthenticatorAssuranceLevel();
  return {
    userId: session.user.id,
    profile,
    isAdmin: profile.role === "admin",
    mfaRequired: assurance?.currentLevel === "aal1" && assurance.nextLevel === "aal2",
  };
}

/**
 * Holds the session and the profile. The screens use it to decide what to show;
 * what a person can actually read or write is decided by the database.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // usePathname leaves out the /kanbo prefix that GitHub Pages adds, so the
  // address we come back to after signing in does not end up doubled.
  const pathname = usePathname();
  const [state, setState] = useState<{ auth: AuthState | null; checked: boolean }>({
    auth: null,
    checked: false,
  });

  useEffect(() => {
    let alive = true;

    void (async () => {
      const auth = await readSession();
      if (alive) setState({ auth, checked: true });
    })();

    // Reacts to signing in or out in this tab and in any other one.
    const { data } = supabase().auth.onAuthStateChange((event) => {
      void (async () => {
        if (event === "SIGNED_OUT") {
          if (alive) setState({ auth: null, checked: true });
          return;
        }
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          const auth = await readSession();
          if (alive) setState({ auth, checked: true });
        }
      })();
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Nobody without a session gets to see the shell.
  useEffect(() => {
    if (!state.checked || state.auth) return;

    const next = `${pathname}${window.location.search}`;
    router.replace(`/login?redirect=${encodeURIComponent(next)}`);
  }, [state, pathname, router]);

  useEffect(() => {
    if (state.auth?.mfaRequired && pathname !== "/cuenta") router.replace("/cuenta");
  }, [state.auth?.mfaRequired, pathname, router]);

  if (!state.auth) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6" aria-busy="true">
        <p className="text-sm text-muted-foreground">
          {state.checked ? "Te estamos llevando a la pantalla de entrada…" : "Cargando…"}
        </p>
      </div>
    );
  }

  return <AuthContext.Provider value={state.auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth se usó fuera de AuthProvider");
  return value;
}

/** Wraps a screen that only the admin should open. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) router.replace("/mi-dia");
  }, [isAdmin, router]);

  if (!isAdmin) return null;
  return <>{children}</>;
}
