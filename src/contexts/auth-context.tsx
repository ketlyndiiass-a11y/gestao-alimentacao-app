"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsConfirmation?: boolean; activatedExisting?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase não configurado." };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const activateFirstAccess = useCallback(async (email: string, password: string) => {
    const response = await fetch("/api/auth/first-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      return {
        error:
          result?.error ??
          "Não foi possível liberar o primeiro acesso. Confira se o e-mail é o mesmo da compra."
      };
    }

    const signInResult = await signIn(email, password);

    if (signInResult.error) {
      return { error: signInResult.error };
    }

    return { activatedExisting: true };
  }, [signIn]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Supabase não configurado." };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      const message = error.message.toLowerCase();
      const alreadyRegistered =
        message.includes("already registered") ||
        message.includes("already been registered") ||
        message.includes("user already");

      if (alreadyRegistered) {
        return activateFirstAccess(email, password);
      }

      return { error: error.message };
    }

    return { needsConfirmation: !data.session };
  }, [activateFirstAccess]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut
    }),
    [loading, session, signIn, signOut, signUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
