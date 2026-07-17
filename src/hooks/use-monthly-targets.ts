"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/contexts/store-context";
import { supabase } from "@/lib/supabase";

const TARGET_STORAGE_KEY = "gestao-alimentacao-monthly-targets";

function targetKey(storeId: string) {
  return `${TARGET_STORAGE_KEY}:${storeId}`;
}

function readLocalTargets(storeId: string) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(targetKey(storeId)) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

type TargetRow = {
  month: string;
  amount: number | string;
};

function monthToDate(month: string) {
  return `${month}-01`;
}

function dateToMonth(date: string) {
  return date.slice(0, 7);
}

function showTargetError(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function useMonthlyTargets() {
  const { user, loading: authLoading } = useAuth();
  const { activeStoreId } = useStore();
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const useRemoteTargets = Boolean(supabase && user && activeStoreId !== "store-main");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (supabase && user && activeStoreId !== "store-main") {
      let cancelled = false;
      const userId = user.id;

      async function loadTargets() {
        setHydrated(false);

        const { data, error } = await supabase!
          .from("monthly_targets")
          .select("month, amount")
          .eq("user_id", userId)
          .eq("store_id", activeStoreId);

        if (cancelled) {
          return;
        }

        if (error) {
          showTargetError("Não foi possível carregar as metas no Supabase.");
          setTargets({});
          setHydrated(true);
          return;
        }

        const nextTargets = ((data ?? []) as TargetRow[]).reduce<Record<string, number>>(
          (acc, row) => {
            acc[dateToMonth(row.month)] = Number(row.amount);
            return acc;
          },
          {}
        );

        setTargets(nextTargets);
        setHydrated(true);
      }

      loadTargets();

      return () => {
        cancelled = true;
      };
    }

    setTargets(readLocalTargets(activeStoreId));
    setHydrated(true);
  }, [activeStoreId, authLoading, user]);

  useEffect(() => {
    if (!useRemoteTargets && hydrated && typeof window !== "undefined") {
      window.localStorage.setItem(targetKey(activeStoreId), JSON.stringify(targets));
    }
  }, [activeStoreId, hydrated, targets, useRemoteTargets]);

  async function saveTarget(month: string, amount: number) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { error } = await supabase.from("monthly_targets").upsert(
        {
          user_id: user.id,
          store_id: activeStoreId,
          month: monthToDate(month),
          amount
        },
        { onConflict: "store_id,month" }
      );

      if (error) {
        showTargetError("Não foi possível salvar a meta no Supabase.");
        return;
      }
    }

    setTargets((current) => ({ ...current, [month]: amount }));
  }

  return {
    targets,
    saveTarget
  };
}
