"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fallbackPlan, findPlan, type Plan } from "@/lib/plans";
import { supabase } from "@/lib/supabase";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "expired";

type SubscriptionRow = {
  status: string;
  plan_code: string;
  current_period_end: string | null;
  data_retention_until: string | null;
};

type SubscriptionState = {
  loading: boolean;
  status: SubscriptionStatus | "missing";
  plan: Plan;
  currentPeriodEnd?: string;
  dataRetentionUntil?: string;
  errorMessage?: string;
};

function normalizePlanCode(planCode?: string | null) {
  if (planCode === "essential" || planCode === "essencial") {
    return "essential";
  }

  if (planCode === "management" || planCode === "gestao" || planCode === "gestão") {
    return "management";
  }

  if (planCode === "elite") {
    return "elite";
  }

  return fallbackPlan.id;
}

function normalizeStatus(status?: string | null): SubscriptionStatus | "missing" {
  if (status === "active" || status === "ativo") {
    return "active";
  }

  if (status === "past_due" || status === "pendente" || status === "atrasado") {
    return "past_due";
  }

  if (status === "canceled" || status === "cancelado") {
    return "canceled";
  }

  if (status === "expired" || status === "expirado") {
    return "expired";
  }

  return "missing";
}

function getPlanFromRow(row?: SubscriptionRow | null) {
  return findPlan(normalizePlanCode(row?.plan_code));
}

function isInsideRetentionWindow(date?: string) {
  if (!date) {
    return false;
  }

  return new Date(date).getTime() >= Date.now();
}

function isDevelopmentTestUser(email?: string | null) {
  return email === "jhonysales8@gmail.com";
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    status: "missing",
    plan: fallbackPlan
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!supabase || !user) {
      setState({ loading: false, status: "missing", plan: fallbackPlan });
      return;
    }

    let cancelled = false;

    async function loadSubscription() {
      setState((current) => ({ ...current, loading: true }));

      let { data, error } = await supabase!
        .from("subscriptions")
        .select("status, plan_code, current_period_end, data_retention_until")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if ((error || !data) && user?.email === "jhonysales8@gmail.com") {
        const result = await supabase!
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              plan_code: "essential",
              status: "active",
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              data_retention_until: null
            },
            { onConflict: "user_id" }
          )
          .select("status, plan_code, current_period_end, data_retention_until")
          .single();

        data = result.data;
        error = result.error;
      }

      if (error || !data) {
        if (isDevelopmentTestUser(user?.email)) {
          setState({
            loading: false,
            status: "active",
            plan: fallbackPlan,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          return;
        }

        setState({
          loading: false,
          status: "missing",
          plan: fallbackPlan,
          errorMessage: error?.message
        });
        return;
      }

      const row = data as unknown as SubscriptionRow;
      setState({
        loading: false,
        status: normalizeStatus(row.status),
        plan: getPlanFromRow(row),
        currentPeriodEnd: row.current_period_end ?? undefined,
        dataRetentionUntil: row.data_retention_until ?? undefined
      });
    }

    loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const hasAccess = useMemo(() => {
    if (state.status === "active") {
      return true;
    }

    if (state.status === "past_due" || state.status === "canceled") {
      return isInsideRetentionWindow(state.dataRetentionUntil);
    }

    return false;
  }, [state.dataRetentionUntil, state.status]);

  return {
    ...state,
    hasAccess
  };
}
