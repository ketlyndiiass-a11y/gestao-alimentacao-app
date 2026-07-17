"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/contexts/store-context";
import { initialBills } from "@/data/initial-bills";
import { supabase } from "@/lib/supabase";
import type { Bill, BillInput, BillStatus } from "@/types/bill";

const STORAGE_KEY = "gestao-alimentacao-bills";
const BILLS_CHANGED_EVENT = "gestao-alimentacao-bills-changed";
const BILL_SELECT_FIELDS =
  "id, kind, title, category, amount, due_date, status, recurrence, paid_at, payment_method, bank, notes";

function storeKey(storeId: string) {
  return `${STORAGE_KEY}:${storeId}`;
}

function normalizeBills(bills: Bill[]) {
  return bills.map((bill) => ({
    ...bill,
    kind: bill.kind ?? (bill.recurrence === "mensal" ? "fixed" : "bill")
  }));
}

function nextMonthlyDueDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const nextMonthIndex = month;
  const daysInNextMonth = new Date(year, nextMonthIndex + 1, 0).getDate();
  const nextDay = Math.min(day, daysInNextMonth);

  return new Date(year, nextMonthIndex, nextDay).toISOString().slice(0, 10);
}

function readStoredBills(storeId: string) {
  if (typeof window === "undefined") {
    return storeId === "store-main" ? initialBills : [];
  }

  const stored = window.localStorage.getItem(storeKey(storeId));

  if (!stored) {
    const legacyStored = window.localStorage.getItem(STORAGE_KEY);
    if (storeId === "store-main" && legacyStored) {
      const legacyBills = normalizeBills(JSON.parse(legacyStored) as Bill[]);
      window.localStorage.setItem(storeKey(storeId), JSON.stringify(legacyBills));
      return legacyBills;
    }
    return storeId === "store-main" ? initialBills : [];
  }

  try {
    return normalizeBills(JSON.parse(stored) as Bill[]);
  } catch {
    return storeId === "store-main" ? initialBills : [];
  }
}

type BillRow = {
  id: string;
  kind: Bill["kind"];
  title: string;
  category: string;
  amount: number | string;
  due_date: string;
  status: BillStatus;
  recurrence: Bill["recurrence"];
  paid_at: string | null;
  payment_method: string | null;
  bank: string | null;
  notes: string | null;
};

function mapBill(row: BillRow): Bill {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    dueDate: row.due_date,
    status: row.status,
    recurrence: row.recurrence,
    paidAt: row.paid_at ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    bank: row.bank ?? undefined,
    notes: row.notes ?? undefined
  };
}

function toBillPayload(input: BillInput, userId: string, storeId: string) {
  return {
    user_id: userId,
    store_id: storeId,
    kind: input.kind,
    title: input.title,
    category: input.category,
    amount: input.amount,
    due_date: input.dueDate,
    status: input.status,
    recurrence: input.recurrence,
    paid_at: input.paidAt ?? null,
    payment_method: input.paymentMethod ?? null,
    bank: input.bank ?? null,
    notes: input.notes ?? null
  };
}

function notifyBillsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BILLS_CHANGED_EVENT));
  }
}

function showBillError(message: string) {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
}

export function useBills() {
  const { user, loading: authLoading } = useAuth();
  const { activeStoreId } = useStore();
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [hydrated, setHydrated] = useState(false);
  const useRemoteBills = Boolean(supabase && user && activeStoreId !== "store-main");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (supabase && user && activeStoreId !== "store-main") {
      let cancelled = false;
      const userId = user.id;

      async function loadRemoteBills() {
        setHydrated(false);

        const { data, error } = await supabase!
          .from("bills")
          .select(BILL_SELECT_FIELDS)
          .eq("user_id", userId)
          .eq("store_id", activeStoreId)
          .order("due_date", { ascending: true })
          .order("created_at", { ascending: false });

        if (cancelled) {
          return;
        }

        if (error) {
          showBillError("Não foi possível carregar as contas no Supabase.");
          setBills([]);
          setHydrated(true);
          return;
        }

        setBills(((data ?? []) as BillRow[]).map(mapBill));
        setHydrated(true);
      }

      loadRemoteBills();

      const reloadBills = () => {
        loadRemoteBills();
      };

      window.addEventListener(BILLS_CHANGED_EVENT, reloadBills);

      return () => {
        cancelled = true;
        window.removeEventListener(BILLS_CHANGED_EVENT, reloadBills);
      };
    }

    setHydrated(false);
    setBills(readStoredBills(activeStoreId));
    setHydrated(true);
  }, [activeStoreId, authLoading, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && hydrated && !useRemoteBills) {
      window.localStorage.setItem(storeKey(activeStoreId), JSON.stringify(bills));
    }
  }, [activeStoreId, bills, hydrated, useRemoteBills]);

  const totals = useMemo(() => {
    const pending = bills
      .filter((bill) => bill.kind === "bill" && bill.status !== "paga")
      .reduce((sum, bill) => sum + bill.amount, 0);

    const paid = bills
      .filter((bill) => bill.status === "paga")
      .reduce((sum, bill) => sum + bill.amount, 0);

    const monthlyFixed = bills
      .filter((bill) => bill.kind === "fixed")
      .reduce((sum, bill) => sum + bill.amount, 0);

    return { pending, paid, monthlyFixed };
  }, [bills]);

  const upcomingBills = useMemo(() => {
    return [...bills]
      .filter((bill) => bill.status !== "paga")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [bills]);

  async function addBill(input: BillInput) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { data, error } = await supabase
        .from("bills")
        .insert(toBillPayload(input, user.id, activeStoreId))
        .select(BILL_SELECT_FIELDS)
        .single();

      if (error || !data) {
        showBillError("Não foi possível salvar esta conta no Supabase.");
        return;
      }

      setBills((current) => [mapBill(data as BillRow), ...current]);
      notifyBillsChanged();
      return;
    }

    setBills((current) => [
      {
        ...input,
        id: `bill-${crypto.randomUUID()}`
      },
      ...current
    ]);
    notifyBillsChanged();
  }

  async function updateBill(id: string, input: BillInput) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { data, error } = await supabase
        .from("bills")
        .update(toBillPayload(input, user.id, activeStoreId))
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId)
        .select(BILL_SELECT_FIELDS)
        .single();

      if (error || !data) {
        showBillError("Não foi possível atualizar esta conta.");
        return;
      }

      setBills((current) => current.map((bill) => (bill.id === id ? mapBill(data as BillRow) : bill)));
      notifyBillsChanged();
      return;
    }

    setBills((current) =>
      current.map((bill) => (bill.id === id ? { ...bill, ...input } : bill))
    );
    notifyBillsChanged();
  }

  async function deleteBill(id: string) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId);

      if (error) {
        showBillError("Não foi possível excluir esta conta.");
        return;
      }

      setBills((current) => current.filter((bill) => bill.id !== id));
      notifyBillsChanged();
      return;
    }

    setBills((current) => current.filter((bill) => bill.id !== id));
    notifyBillsChanged();
  }

  async function updateBillStatus(id: string, status: BillStatus) {
    if (supabase && user && activeStoreId !== "store-main") {
      const { data, error } = await supabase
        .from("bills")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId)
        .select(BILL_SELECT_FIELDS)
        .single();

      if (error || !data) {
        showBillError("Não foi possível alterar o status desta conta.");
        return;
      }

      setBills((current) => current.map((bill) => (bill.id === id ? mapBill(data as BillRow) : bill)));
      notifyBillsChanged();
      return;
    }

    setBills((current) =>
      current.map((bill) => (bill.id === id ? { ...bill, status } : bill))
    );
    notifyBillsChanged();
  }

  async function markBillPaid(
    id: string,
    payment: { paidAt: string; paymentMethod: string; bank?: string; amount?: number }
  ) {
    const existingBill = bills.find((bill) => bill.id === id);

    if (!existingBill) {
      return undefined;
    }

    const paidBill: Bill = {
      ...existingBill,
      amount: payment.amount ?? existingBill.amount,
      status: "paga",
      paidAt: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      bank: payment.bank
    };
    const isRecurringFixed = existingBill.kind === "fixed" && existingBill.recurrence === "mensal";
    const nextRecurringBill: Bill = {
      ...existingBill,
      dueDate: nextMonthlyDueDate(existingBill.dueDate),
      status: "pendente",
      paidAt: undefined,
      paymentMethod: undefined,
      bank: undefined
    };
    const paidHistoryBill: Bill = {
      ...paidBill,
      id: `bill-paid-${crypto.randomUUID()}`,
      kind: "bill",
      recurrence: "unica",
      notes: paidBill.notes || "Pagamento de custo fixo recorrente"
    };

    if (supabase && user && activeStoreId !== "store-main") {
      if (isRecurringFixed) {
        const { data: updatedFixed, error: updateError } = await supabase
          .from("bills")
          .update(toBillPayload(nextRecurringBill, user.id, activeStoreId))
          .eq("id", id)
          .eq("user_id", user.id)
          .eq("store_id", activeStoreId)
          .select(BILL_SELECT_FIELDS)
          .single();

        if (updateError || !updatedFixed) {
          showBillError("Não foi possível avançar este custo fixo para o próximo mês.");
          return undefined;
        }

        const { data: createdHistory, error: historyError } = await supabase
          .from("bills")
          .insert(toBillPayload(paidHistoryBill, user.id, activeStoreId))
          .select(BILL_SELECT_FIELDS)
          .single();

        if (historyError || !createdHistory) {
          showBillError("O custo fixo avançou, mas não foi possível criar o histórico de pagamento.");
          return undefined;
        }

        const fixed = mapBill(updatedFixed as BillRow);
        const history = mapBill(createdHistory as BillRow);
        setBills((current) => [
          history,
          ...current.map((bill) => (bill.id === id ? fixed : bill))
        ]);
        notifyBillsChanged();
        return paidBill;
      }

      const { data, error } = await supabase
        .from("bills")
        .update(toBillPayload(paidBill, user.id, activeStoreId))
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("store_id", activeStoreId)
        .select(BILL_SELECT_FIELDS)
        .single();

      if (error || !data) {
        showBillError("Não foi possível marcar esta conta como paga.");
        return undefined;
      }

      const remotePaidBill = mapBill(data as BillRow);
      setBills((current) =>
        current.map((bill) => (bill.id === id ? remotePaidBill : bill))
      );
      notifyBillsChanged();
      return remotePaidBill;
    }

    if (isRecurringFixed) {
      setBills((current) => [
        paidHistoryBill,
        ...current.map((bill) => (bill.id === id ? nextRecurringBill : bill))
      ]);
      notifyBillsChanged();
      return paidBill;
    }

    setBills((current) =>
      current.map((bill) => (bill.id === id ? paidBill : bill))
    );

    notifyBillsChanged();
    return paidBill;
  }

  return {
    bills,
    totals,
    upcomingBills,
    addBill,
    updateBill,
    deleteBill,
    updateBillStatus,
    markBillPaid
  };
}
