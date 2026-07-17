"use client";

import { useEffect } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";

export function ThemeLoader() {
  const { theme } = useUserSettings();

  useEffect(() => {
    document.documentElement.dataset.appTheme = theme;
  }, [theme]);

  return null;
}
