"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/contexts/store-context";
import { initialTransactions } from "@/data/initial-transactions";
import { supabase } from "@/lib/supabase";
import type { Transaction, TransactionInput, TransactionType } from "@/types/transaction";

const STORAGE_KEY = "gestao-alimentacao-transactions";
const TRANSACTIONS_CHANGED_EVENT = "gestao-alimentacao-transactions-changed";

function storeKey(storeId: string) {
  return `${STORAGE_KEY}:${storeId}`;
}

function readStoredTransactions(storeId: string) {
  if (typeof window === "undefined") {
    return storeId === "store-main" ? initialTransactions : [];
  }

  const stored = window.localStorage.getItem(storeKey(storeId));

  if (!stored) {
    const legacyStored = window.localStorage.getItem(STORAGE_KEY);
    if (storeId === "store-main" && legacyStored) {
      window.localStorage.setItem(storeKey(storeId), legacyStored);
      return JSON.parse(legacyStored) as Transaction[];
    }
    return storeId === "store-main" ? initialTransactions : [];
  }

  try {
    return JSON.parse(stored) as Transaction[];
  } catch {
    return storeId === "store-main" ? initialTransactions : [];
  }
}

type TransactionRow = {
  id: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number | string;
  transaction_date: string;
  period: Transaction["period"] | null;
  period_label: string | null;
  payment_method: string | null;
  business_hours: string | null;
  notes: string | null;
};

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    date: row.transaction_date,
    period: row.period ?? "daily",
    periodLabel: row.period_label ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    businessHours: row.business_hours ?? undefined,
    notes: row.notes ?? undefined
  };
}

function toTransactionPayload(input: TransactionInput, userId: string, storeId: string) {
  return {
    user_id: userId,
    store_id: storeId,
    type: input.type,
    description: input.description,
    category: input.category,
    amount: input.amount,
    transaction_date: input.date,
    period: input.period ?? "daily",
    period_label: input.periodLabel ?? null,
    payment_method: input.paymentMethod ?? null,
    business_hours: input.businessHours ?? null,
    notes: input.notes ?? null
  };
}

function notifyTransactionsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
  }
}

function showTransactionError(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function useTransactions(type?: TransactionType) {
  const { user, loading: authLoading } = useAuth();
  const { activeStoreId } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [hydrated, setHydrated] = useState(false);
  const useRemoteTransactions = Boolean(supabase && user && activeStoreId !== "store-main");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (supabase && user && activeStoreId !== "store-main") {
      let cancelled = false;

      async function loadRemoteTransactions() {
        setHydrated(false);

        const { data, error } = await supabase!
          .from("transactions")
          .select(
            "id, type, description, category, amount, transaction_date, period, period_label, payment_method, business_hours, notes"
          )
          .eq("user_id", user!.id)
          .eq("store_id", activeStoreId)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (cancelled) {
          return;
        }

        if (error) {
          showTransactionError("Não foi possível carregar entradas e saídas no Supabase.");
          setTransactions([]);
          setHydrated(true);
          return;
        }

        setTransactions(((data ?? []) as TransactionRow[]).map(mapTransaction));
        setHydrated(true);
      }

      loadRemoteTransactions();

      const reloadTransactions = () => {
        loadRemoteTransactions();
      };

      window.addEventListener(TRANSACTIONS_CHANGED_EVENT, reloadTransactions);

      return () => {
        cancelled = true;
        window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, reloadTransactions);
      };
    }

    setHydrated(false);
    setTransactions(readStoredTransactions(activeStoreId));
    setHydrated(true);
  }, [activeStoreId, authLoading, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && hydrated && !useRemoteTransactions) {
      window.localStorage.setItem(storeKey(activeStoreId), JSON.stringify(transactions));
    }
  }, [activeStoreId, hydrated, transactions, useRemoteTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!type) {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.type === type);
  }, [transactions, type]);

  const totals = useMemo(() => {
    const revenue = transactions
      .filter((transaction) => transaction.type === "entrada")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expenses = transactions
      .filter((transaction) => transaction.type === "despesa")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      revenue,
      expenses,
      net: revenue - expenses
    };
  }, [transactions]);

  async function addTransaction(input: TransactionInput) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { data, error } = await supabase
        .from("transactions")
        .insert(toTransactionPayload(input, user.id, activeStoreId))
        .select(
          "id, type, description, category, amount, transaction_date, period, period_label, payment_method, business_hours, notes"
        )
        .single();

      if (error || !data) {
        showTransactionError("Não foi possível salvar este lançamento no Supabase.");
        return;
      }

      setTransactions((current) => [mapTransaction(data as TransactionRow), ...current]);
      notifyTransactionsChanged();
      return;
    }

    const transaction: Transaction = {
      ...input,
      id: `${input.type}-${crypto.randomUUID()}`
    };

    setTransactions((current) => [transaction, ...current]);
    notifyTransactionsChanged();
  }

  async function updateTransaction(id: string, input: TransactionInput) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { data, error } = await supabase
        .from("transactions")
        .update(toTransactionPayload(input, user.id, activeStoreId))
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId)
        .select(
          "id, type, description, category, amount, transaction_date, period, period_label, payment_method, business_hours, notes"
        )
        .single();

      if (error || !data) {
        showTransactionError("Não foi possível atualizar este lançamento.");
        return;
      }

      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === id ? mapTransaction(data as TransactionRow) : transaction
        )
      );
      notifyTransactionsChanged();
      return;
    }

    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id ? { ...transaction, ...input } : transaction
      )
    );
    notifyTransactionsChanged();
  }

  async function deleteTransaction(id: string) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId);

      if (error) {
        showTransactionError("Não foi possível excluir este lançamento.");
        return;
      }

      setTransactions((current) => current.filter((transaction) => transaction.id !== id));
      notifyTransactionsChanged();
      return;
    }

    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
    notifyTransactionsChanged();
  }

  return {
    transactions: filteredTransactions,
    allTransactions: transactions,
    totals,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
}
