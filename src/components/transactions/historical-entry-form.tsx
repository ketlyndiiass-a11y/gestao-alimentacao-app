"use client";

import { FormEvent, useState } from "react";
import type { TransactionInput, TransactionType } from "@/types/transaction";

type HistoricalEntryFormProps = {
  type: TransactionType;
  onSubmit: (transaction: TransactionInput) => void;
};

function parseMoney(value: string) {
  return Number(value.trim().replace(/\./g, "").replace(",", ".")) || 0;
}

function formatMoneyInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function currentYear() {
  return String(new Date().getFullYear());
}

export function HistoricalEntryForm({ type, onSubmit }: HistoricalEntryFormProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(currentYear());
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  function formatAmount() {
    const parsedAmount = parseMoney(amount);
    setAmount(parsedAmount ? formatMoneyInput(parsedAmount) : "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = parseMoney(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return;
    }

    const isMonth = period === "monthly";
    const isIncome = type === "entrada";
    const selectedDate = isMonth ? `${month}-01` : `${year}-01-01`;
    const label = isMonth ? monthLabel(month) : `Ano de ${year}`;

    onSubmit({
      type,
      description: isIncome
        ? isMonth
          ? "Vendas do mês"
          : "Vendas do ano"
        : isMonth
          ? "Saídas do mês"
          : "Saídas do ano",
      category: "Geral",
      amount: parsedAmount,
      date: selectedDate,
      period,
      periodLabel: label,
      paymentMethod: "Todos",
      notes: notes.trim() || "Lançamento anterior"
    });

    setAmount("");
    setNotes("");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPeriod("monthly")}
          className={`rounded-lg border px-3 py-3 font-semibold ${
            period === "monthly" ? "border-brand bg-brand text-white" : "border-line bg-white"
          }`}
        >
          Mês inteiro
        </button>
        <button
          type="button"
          onClick={() => setPeriod("yearly")}
          className={`rounded-lg border px-3 py-3 font-semibold ${
            period === "yearly" ? "border-brand bg-brand text-white" : "border-line bg-white"
          }`}
        >
          Ano inteiro
        </button>
      </div>

      {period === "monthly" ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Mês</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Ano</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
        </label>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">
          {type === "entrada" ? "Valor vendido" : "Valor de saída"}
        </span>
        <input
          className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
          value={amount}
          onBlur={formatAmount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="0,00"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">Observação</span>
        <textarea
          className="min-h-20 rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Opcional"
        />
      </label>

      <button className="rounded-lg bg-brand px-4 py-3 font-semibold text-white">
        Salvar lançamento anterior
      </button>
    </form>
  );
}
