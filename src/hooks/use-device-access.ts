"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

const DEVICE_FINGERPRINT_KEY = "gestao-alimentacao-device-fingerprint";

type DeviceAccessState = {
  loading: boolean;
  allowed: boolean;
  currentDeviceId?: string;
  deviceCount: number;
  registrationError?: string;
};

function getDeviceFingerprint() {
  if (typeof window === "undefined") {
    return "";
  }

  const savedFingerprint = window.localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (savedFingerprint) {
    return savedFingerprint;
  }

  const fingerprint = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
  return fingerprint;
}

function getDeviceLabel() {
  if (typeof navigator === "undefined") {
    return "Dispositivo";
  }

  const platform = navigator.platform || "Dispositivo";
  const browser = navigator.userAgent.includes("Mobile") ? "Celular" : "Navegador";
  return `${browser} - ${platform}`;
}

export function useDeviceAccess(deviceLimit: number, enabled: boolean) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DeviceAccessState>({
    loading: true,
    allowed: false,
    deviceCount: 0
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!enabled) {
      setState({ loading: false, allowed: false, deviceCount: 0 });
      return;
    }

    if (!supabase || !user) {
      setState({ loading: false, allowed: true, deviceCount: 1 });
      return;
    }

    let cancelled = false;

    async function registerDevice() {
      setState((current) => ({ ...current, loading: true }));

      const fingerprint = getDeviceFingerprint();
      const deviceLabel = getDeviceLabel();

      const { data: existingDevice, error: existingError } = await supabase!
        .from("device_sessions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (existingError) {
        setState({
          loading: false,
          allowed: true,
          deviceCount: 0,
          registrationError: existingError.message
        });
        return;
      }

      if (existingDevice?.id) {
        await supabase!
          .from("device_sessions")
          .update({ device_label: deviceLabel, last_seen_at: new Date().toISOString() })
          .eq("id", existingDevice.id)
          .eq("user_id", user!.id);

        const { count } = await supabase!
          .from("device_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id);

        if (!cancelled) {
          setState({
            loading: false,
            allowed: true,
            currentDeviceId: existingDevice.id,
            deviceCount: count ?? 1
          });
        }
        return;
      }

      const { count } = await supabase!
        .from("device_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);

      if (cancelled) {
        return;
      }

      const currentCount = count ?? 0;

      if (currentCount >= deviceLimit) {
        setState({
          loading: false,
          allowed: false,
          deviceCount: currentCount
        });
        return;
      }

      const { data: createdDevice, error: createError } = await supabase!
        .from("device_sessions")
        .upsert({
          user_id: user!.id,
          device_label: deviceLabel,
          device_fingerprint: fingerprint,
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: "user_id,device_fingerprint"
        })
        .select("id")
        .single();

      if (cancelled) {
        return;
      }

      if (createError) {
        const { data: createdByAnotherRequest } = await supabase!
          .from("device_sessions")
          .select("id")
          .eq("user_id", user!.id)
          .eq("device_fingerprint", fingerprint)
          .maybeSingle();

        setState({
          loading: false,
          allowed: Boolean(createdByAnotherRequest?.id) || currentCount < deviceLimit,
          currentDeviceId: createdByAnotherRequest?.id,
          deviceCount: createdByAnotherRequest?.id ? currentCount + 1 : currentCount,
          registrationError: createdByAnotherRequest?.id ? undefined : createError.message
        });
        return;
      }

      setState({
        loading: false,
        allowed: true,
        currentDeviceId: createdDevice?.id,
        deviceCount: currentCount + 1
      });
    }

    registerDevice();

    return () => {
      cancelled = true;
    };
  }, [authLoading, deviceLimit, enabled, user]);

  return state;
}
