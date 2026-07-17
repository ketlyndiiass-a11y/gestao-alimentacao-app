"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

const DEVICE_FINGERPRINT_KEY = "gestao-alimentacao-device-fingerprint";

export type DeviceSession = {
  id: string;
  deviceLabel: string;
  lastSeenAt: string;
  createdAt: string;
};

type DeviceSessionRow = {
  id: string;
  device_label: string | null;
  last_seen_at: string;
  created_at: string;
};

function mapDeviceSession(row: DeviceSessionRow): DeviceSession {
  return {
    id: row.id,
    deviceLabel: row.device_label ?? "Dispositivo",
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at
  };
}

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

export function useDeviceSessions() {
  const { user, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function registerCurrentDevice() {
    if (!supabase || !user) {
      return;
    }

    const { error } = await supabase
      .from("device_sessions")
      .upsert(
        {
          user_id: user.id,
          device_label: getDeviceLabel(),
          device_fingerprint: getDeviceFingerprint(),
          last_seen_at: new Date().toISOString()
        },
        { onConflict: "user_id,device_fingerprint" }
      );

    if (error) {
      setErrorMessage(error.message);
    }
  }

  async function loadDevices() {
    if (!supabase || !user) {
      setDevices([]);
      setLoading(false);
      return;
    }

    await registerCurrentDevice();

    const { data, error } = await supabase
      .from("device_sessions")
      .select("id, device_label, last_seen_at, created_at")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
    }

    setDevices(((data ?? []) as DeviceSessionRow[]).map(mapDeviceSession));
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function removeDevice(id: string) {
    if (!supabase || !user) {
      return;
    }

    const { error } = await supabase
      .from("device_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      setDevices((current) => current.filter((device) => device.id !== id));
    }
  }

  return {
    devices,
    errorMessage,
    loading,
    removeDevice,
    reloadDevices: loadDevices
  };
}
