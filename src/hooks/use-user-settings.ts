"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

export type AppTheme = "light" | "neutral" | "dark";

const THEME_KEY = "gestao-alimentacao-theme";
const fallbackTheme: AppTheme = "neutral";

function isAppTheme(theme: string | null): theme is AppTheme {
  return theme === "light" || theme === "neutral" || theme === "dark";
}

function readLocalTheme() {
  if (typeof window === "undefined") {
    return fallbackTheme;
  }

  const savedTheme = window.localStorage.getItem(THEME_KEY);
  return isAppTheme(savedTheme) ? savedTheme : fallbackTheme;
}

function applyTheme(theme: AppTheme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.appTheme = theme;
  }
}

function showSettingsError(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function useUserSettings() {
  const { user, loading: authLoading } = useAuth();
  const [theme, setThemeState] = useState<AppTheme>(fallbackTheme);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (supabase && user) {
      let cancelled = false;

      async function loadSettings() {
        const { data, error } = await supabase!
          .from("user_settings")
          .select("theme")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (cancelled) {
          return;
        }

        if (error) {
          const localTheme = readLocalTheme();
          setThemeState(localTheme);
          applyTheme(localTheme);
          return;
        }

        const nextTheme = isAppTheme(data?.theme ?? null) ? data!.theme : readLocalTheme();
        setThemeState(nextTheme);
        applyTheme(nextTheme);
        window.localStorage.setItem(THEME_KEY, nextTheme);
      }

      loadSettings();

      return () => {
        cancelled = true;
      };
    }

    const localTheme = readLocalTheme();
    setThemeState(localTheme);
    applyTheme(localTheme);
  }, [authLoading, user]);

  async function setTheme(nextTheme: AppTheme) {
    setThemeState(nextTheme);
    applyTheme(nextTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, nextTheme);
    }

    if (supabase && user) {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          theme: nextTheme
        },
        { onConflict: "user_id" }
      );

      if (error) {
        showSettingsError("Não foi possível salvar o tema no Supabase.");
      }
    }
  }

  return {
    theme,
    setTheme
  };
}
