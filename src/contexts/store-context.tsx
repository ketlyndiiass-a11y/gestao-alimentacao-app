"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

export type Store = {
  id: string;
  name: string;
};

type StoreContextValue = {
  stores: Store[];
  activeStore: Store;
  activeStoreId: string;
  addStore: (name: string) => Promise<void> | void;
  renameStore: (id: string, name: string) => Promise<void> | void;
  setActiveStoreId: (id: string) => void;
};

const STORES_KEY = "gestao-alimentacao-stores";
const ACTIVE_STORE_KEY = "gestao-alimentacao-active-store";

const defaultStores: Store[] = [
  { id: "store-main", name: "Loja principal" }
];

const StoreContext = createContext<StoreContextValue | null>(null);

function readStores() {
  if (typeof window === "undefined") {
    return defaultStores;
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORES_KEY) || "") as Store[];
  } catch {
    return defaultStores;
  }
}

function saveActiveStore(id: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACTIVE_STORE_KEY, id);
  }
}

function getStoredActiveStore() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_STORE_KEY);
}

function showStoreError(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>(defaultStores);
  const [activeStoreId, setActiveStoreIdState] = useState(defaultStores[0].id);
  const useRemoteStores = Boolean(supabase && user);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (supabase && user) {
      let cancelled = false;
      const userId = user.id;

      async function loadStores() {
        const { data, error } = await supabase!
          .from("stores")
          .select("id, name")
          .eq("user_id", userId)
          .is("archived_at", null)
          .order("created_at", { ascending: true });

        if (cancelled) {
          return;
        }

        if (error) {
          showStoreError("Não foi possível carregar suas lojas. Usaremos os dados salvos neste aparelho por enquanto.");
          const localStores = readStores();
          setStores(localStores.length ? localStores : defaultStores);
          setActiveStoreIdState(getStoredActiveStore() || localStores[0]?.id || defaultStores[0].id);
          return;
        }

        let nextStores = (data ?? []) as Store[];

        if (!nextStores.length) {
          const { data: createdStore, error: createError } = await supabase!
            .from("stores")
            .insert({ user_id: userId, name: "Loja principal" })
            .select("id, name")
            .single();

          if (cancelled) {
            return;
          }

          if (createError || !createdStore) {
            showStoreError("Não foi possível criar a loja principal no Supabase.");
            return;
          }

          nextStores = [createdStore as Store];
        }

        const storedActiveStore = getStoredActiveStore();
        const nextActiveStore =
          nextStores.find((store) => store.id === storedActiveStore)?.id ?? nextStores[0].id;

        setStores(nextStores);
        setActiveStoreIdState(nextActiveStore);
        saveActiveStore(nextActiveStore);
      }

      loadStores();

      return () => {
        cancelled = true;
      };
    }

    const storedStores = readStores();
    const storedActiveStore = getStoredActiveStore();

    setStores(storedStores.length ? storedStores : defaultStores);
    setActiveStoreIdState(storedActiveStore || storedStores[0]?.id || defaultStores[0].id);
  }, [authLoading, user]);

  useEffect(() => {
    if (!useRemoteStores) {
      window.localStorage.setItem(STORES_KEY, JSON.stringify(stores));
    }
  }, [stores, useRemoteStores]);

  useEffect(() => {
    saveActiveStore(activeStoreId);
  }, [activeStoreId]);

  const activeStore = stores.find((store) => store.id === activeStoreId) ?? stores[0] ?? defaultStores[0];

  const setActiveStoreId = useCallback((id: string) => {
    setActiveStoreIdState(id);
  }, []);

  const addStore = useCallback(async (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    if (supabase && user) {
      const { data, error } = await supabase
        .from("stores")
        .insert({ user_id: user.id, name: trimmedName })
        .select("id, name")
        .single();

      if (error || !data) {
        showStoreError(
          "Não foi possível adicionar esta loja. Confira se o plano atual permite mais lojas."
        );
        return;
      }

      const store = data as Store;
      setStores((current) => [...current, store]);
      setActiveStoreIdState(store.id);
      return;
    }

    const store: Store = {
      id: `store-${crypto.randomUUID()}`,
      name: trimmedName
    };

    setStores((current) => [...current, store]);
    setActiveStoreIdState(store.id);
  }, [user]);

  const renameStore = useCallback(async (id: string, name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    if (supabase && user) {
      const { error } = await supabase
        .from("stores")
        .update({ name: trimmedName })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        showStoreError("Não foi possível alterar o nome desta loja.");
        return;
      }
    }

    setStores((current) =>
      current.map((store) => (store.id === id ? { ...store, name: trimmedName } : store))
    );
  }, [user]);

  const value = useMemo(
    () => ({ stores, activeStore, activeStoreId: activeStore.id, addStore, renameStore, setActiveStoreId }),
    [activeStore, addStore, renameStore, setActiveStoreId, stores]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
}
