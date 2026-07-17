"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { HistoricalEntryForm } from "@/components/transactions/historical-entry-form";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/hooks/use-transactions";
import { currency } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types/transaction";

type TransactionPageProps = {
  type: TransactionType;
  title: string;
  description: string;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function daysInMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

export function TransactionPage({ type, title, description }: TransactionPageProps) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions(type);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [selectedDay, setSelectedDay] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [entryTab, setEntryTab] = useState<"new" | "history">("new");
  const isIncome = type === "entrada";

  const dayOptions = useMemo(() => {
    return Array.from({ length: daysInMonth(selectedMonth) }, (_, index) =>
      String(index + 1).padStart(2, "0")
    );
  }, [selectedMonth]);

  const filteredTransactions = useMemo(() => {
    const selectedYear = selectedMonth.slice(0, 4);

    return transactions
      .filter((transaction) => {
        if (transaction.period === "yearly") {
          return transaction.date.startsWith(selectedYear);
        }

        return transaction.date.startsWith(selectedMonth);
      })
      .filter((transaction) => {
        if (!selectedDay || transaction.period === "yearly" || transaction.period === "monthly") {
          return true;
        }

        return transaction.date.endsWith(`-${selectedDay}`);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedDay, selectedMonth, transactions]);

  const total = filteredTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );

  function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(
      `Deseja confirmar a exclusão deste lançamento de ${currency(transaction.amount)}?`
    );

    if (confirmed) {
      deleteTransaction(transaction.id);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <p className="text-sm font-medium text-muted">Financeiro</p>
      <h2 className="mt-1 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-2xl text-muted">{description}</p>

      <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card className="p-5">
          {!editingTransaction && (
            <div className="mb-4 grid grid-cols-2 rounded-lg border border-line bg-canvas p-1">
              <button
                type="button"
                onClick={() => setEntryTab("new")}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  entryTab === "new" ? "bg-white shadow-sm" : "text-muted"
                }`}
              >
                Novo lançamento
              </button>
              <button
                type="button"
                onClick={() => setEntryTab("history")}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  entryTab === "history" ? "bg-white shadow-sm" : "text-muted"
                }`}
              >
                Lançamentos anteriores
              </button>
            </div>
          )}

          <h3 className="mb-4 text-lg font-semibold">
            {editingTransaction
              ? "Editar lançamento"
              : entryTab === "history" && isIncome
                ? "Lançamentos anteriores"
                : "Novo lançamento"}
          </h3>

          {entryTab === "history" && !editingTransaction ? (
            <HistoricalEntryForm type={type} onSubmit={addTransaction} />
          ) : (
            <TransactionForm
              key={editingTransaction?.id ?? "new"}
              type={type}
              initialTransaction={editingTransaction}
              onSubmit={(transaction) => {
                if (editingTransaction) {
                  updateTransaction(editingTransaction.id, transaction);
                  setEditingTransaction(null);
                } else {
                  addTransaction(transaction);
                }
              }}
              onCancel={
                editingTransaction ? () => setEditingTransaction(null) : undefined
              }
            />
          )}
        </Card>

        <div className="space-y-5">
          <MetricCard
            label={type === "entrada" ? "Total de entradas" : "Total de despesas"}
            value={currency(total)}
            tone={type === "entrada" ? "success" : "danger"}
          />

          <Card className="p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Lançamentos</h3>
                <p className="text-sm text-muted">
                  Consulte os lançamentos por mês ou por dia.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted">Mês</span>
                  <input
                    className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => {
                      setSelectedMonth(event.target.value);
                      setSelectedDay("");
                    }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted">Dia</span>
                  <select
                    className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                    value={selectedDay}
                    onChange={(event) => setSelectedDay(event.target.value)}
                  >
                    <option value="">Todos</option>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <TransactionList
              transactions={filteredTransactions}
              onEdit={setEditingTransaction}
              onDelete={handleDelete}
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
