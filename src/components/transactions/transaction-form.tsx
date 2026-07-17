"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Transaction, TransactionInput, TransactionType } from "@/types/transaction";

type TransactionFormProps = {
  type: TransactionType;
  onSubmit: (transaction: TransactionInput) => void;
  initialTransaction?: Transaction | null;
  onCancel?: () => void;
};

const categories = {
  entrada: ["Geral", "Balcão", "Delivery", "iFood", "Evento", "Outro"],
  despesa: ["Geral", "Insumos", "Embalagens", "Conta fixa", "Funcionário", "Fornecedor", "Outro"]
};

const paymentMethods = ["Todos", "Pix", "Dinheiro", "Cartão", "Boleto", "iFood", "Outro"];
const HOURS_STORAGE_KEY = "gestao-alimentacao-business-hours";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseMoney(value: string) {
  return Number(value.trim().replace(/\./g, "").replace(",", ".")) || 0;
}

function formatMoneyInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatEditableMoney(value: number) {
  return value ? formatMoneyInput(value) : "";
}

function parseBusinessHours(hours?: string) {
  const [start = "08:00", end = "18:00"] = (hours || "08:00 - 18:00")
    .split("-")
    .map((item) => item.trim());

  return { start, end };
}

export function TransactionForm({
  type,
  onSubmit,
  initialTransaction,
  onCancel
}: TransactionFormProps) {
  const isIncome = type === "entrada";
  const initialHours = parseBusinessHours(initialTransaction?.businessHours);
  const [description, setDescription] = useState(initialTransaction?.description ?? "");
  const [category, setCategory] = useState(
    initialTransaction?.category ?? (isIncome ? "Geral" : categories[type][0])
  );
  const [amount, setAmount] = useState(
    initialTransaction ? formatEditableMoney(initialTransaction.amount) : ""
  );
  const [date, setDate] = useState(initialTransaction?.date ?? today());
  const [dateMode, setDateMode] = useState<"today" | "custom">(
    initialTransaction && initialTransaction.date !== today() ? "custom" : "today"
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialTransaction?.paymentMethod ?? (isIncome ? "Todos" : "Pix")
  );
  const [businessStart, setBusinessStart] = useState(initialHours.start);
  const [businessEnd, setBusinessEnd] = useState(initialHours.end);
  const [saveHours, setSaveHours] = useState(false);
  const [notes, setNotes] = useState(initialTransaction?.notes ?? "");

  useEffect(() => {
    if (!isIncome || initialTransaction) {
      return;
    }

    const storedHours = window.localStorage.getItem(HOURS_STORAGE_KEY);
    if (storedHours) {
      const parsed = parseBusinessHours(storedHours);
      setBusinessStart(parsed.start);
      setBusinessEnd(parsed.end);
      setSaveHours(true);
    }
  }, [initialTransaction, isIncome]);

  useEffect(() => {
    if (!initialTransaction) {
      return;
    }

    const parsedHours = parseBusinessHours(initialTransaction.businessHours);
    setDescription(initialTransaction.description);
    setCategory(initialTransaction.category);
    setAmount(formatEditableMoney(initialTransaction.amount));
    setDate(initialTransaction.date);
    setDateMode(initialTransaction.date === today() ? "today" : "custom");
    setPaymentMethod(initialTransaction.paymentMethod ?? (isIncome ? "Todos" : "Pix"));
    setBusinessStart(parsedHours.start);
    setBusinessEnd(parsedHours.end);
    setNotes(initialTransaction.notes ?? "");
  }, [initialTransaction, isIncome]);

  useEffect(() => {
    if (isIncome && saveHours) {
      window.localStorage.setItem(HOURS_STORAGE_KEY, `${businessStart} - ${businessEnd}`);
    }
  }, [businessEnd, businessStart, isIncome, saveHours]);

  function selectToday() {
    setDateMode("today");
    setDate(today());
  }

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

    const businessHours = `${businessStart} - ${businessEnd}`;

    onSubmit({
      type,
      description: isIncome ? "Vendas gerais" : description.trim(),
      category,
      amount: parsedAmount,
      date,
      paymentMethod,
      businessHours: isIncome ? businessHours : undefined,
      notes: notes.trim()
    });

    if (isIncome && saveHours) {
      window.localStorage.setItem(HOURS_STORAGE_KEY, businessHours);
    }

    if (!initialTransaction) {
      setDescription("");
      setAmount("");
      setNotes("");
      selectToday();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {!isIncome && (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Descrição</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex: Compra de carnes"
          />
        </label>
      )}

      <div className="grid gap-3">
        <span className="text-sm font-medium text-muted">Data</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={selectToday}
            className={`rounded-lg border px-3 py-3 font-semibold ${
              dateMode === "today" ? "border-brand bg-brand text-white" : "border-line bg-white"
            }`}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setDateMode("custom")}
            className={`rounded-lg border px-3 py-3 font-semibold ${
              dateMode === "custom" ? "border-brand bg-brand text-white" : "border-line bg-white"
            }`}
          >
            Personalizado
          </button>
        </div>
        {dateMode === "custom" && (
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        )}
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">
          {isIncome ? "Valor da venda" : "Valor"}
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

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Categoria</span>
          <select
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories[type].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Forma de pagamento</span>
          <select
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            {paymentMethods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      {isIncome && (
        <div className="grid gap-2">
          <span className="text-sm font-medium text-muted">Horário de funcionamento</span>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted">Abre</span>
              <input
                className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
                type="time"
                value={businessStart}
                onChange={(event) => setBusinessStart(event.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-muted">Fecha</span>
              <input
                className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
                type="time"
                value={businessEnd}
                onChange={(event) => setBusinessEnd(event.target.value)}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted">
            <input
              className="size-4 accent-brand"
              type="checkbox"
              checked={saveHours}
              onChange={(event) => setSaveHours(event.target.checked)}
            />
            Salvar horário
          </label>
        </div>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">Observação</span>
        <textarea
          className="min-h-24 rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Opcional"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="rounded-lg bg-brand px-4 py-3 font-semibold text-white">
          {initialTransaction
            ? "Salvar alterações"
            : `Salvar ${isIncome ? "entrada" : "despesa"}`}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line bg-white px-4 py-3 font-semibold"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
