"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Bill, BillInput, BillKind } from "@/types/bill";

type BillFormProps = {
  kind: BillKind;
  onSubmit: (bill: BillInput) => void;
  initialBill?: Bill | null;
  onCancel?: () => void;
};

const fixedCategories = ["Aluguel", "Energia", "Água", "Funcionário", "Internet", "Contador", "Outro"];
const billCategories = ["Fornecedor", "Imposto", "Equipamento", "Manutenção", "Compra parcelada", "Outro"];

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

export function BillForm({ kind, onSubmit, initialBill, onCancel }: BillFormProps) {
  const isFixed = kind === "fixed";
  const categories = isFixed ? fixedCategories : billCategories;
  const [title, setTitle] = useState(initialBill?.title ?? "");
  const [category, setCategory] = useState(initialBill?.category ?? categories[0]);
  const [amount, setAmount] = useState(
    initialBill ? formatMoneyInput(initialBill.amount) : ""
  );
  const [dueDate, setDueDate] = useState(initialBill?.dueDate ?? today());
  const [notes, setNotes] = useState(initialBill?.notes ?? "");

  useEffect(() => {
    if (!initialBill) {
      setCategory(categories[0]);
      return;
    }

    setTitle(initialBill.title);
    setCategory(initialBill.category);
    setAmount(formatMoneyInput(initialBill.amount));
    setDueDate(initialBill.dueDate);
    setNotes(initialBill.notes ?? "");
  }, [categories, initialBill]);

  function formatAmount() {
    const parsedAmount = parseMoney(amount);
    setAmount(parsedAmount ? formatMoneyInput(parsedAmount) : "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = parseMoney(amount);

    if (!title.trim() || !parsedAmount || parsedAmount <= 0) {
      return;
    }

    onSubmit({
      kind,
      title: title.trim(),
      category,
      amount: parsedAmount,
      dueDate,
      status: initialBill?.status ?? "pendente",
      recurrence: isFixed ? "mensal" : "unica",
      paidAt: initialBill?.paidAt,
      paymentMethod: initialBill?.paymentMethod,
      bank: initialBill?.bank,
      notes: notes.trim()
    });

    if (!initialBill) {
      setTitle("");
      setAmount("");
      setNotes("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">
          {isFixed ? "Nome do custo fixo" : "Nome do boleto"}
        </span>
        <input
          className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={isFixed ? "Ex: Aluguel, funcionário" : "Ex: Fornecedor, imposto"}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-muted">Valor previsto</span>
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
          <span className="text-sm font-medium text-muted">Vencimento</span>
          <input
            className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-muted">Categoria</span>
        <select
          className="rounded-lg border border-line bg-white px-3 py-3 outline-none focus:border-brand"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="rounded-lg bg-brand px-4 py-3 font-semibold text-white">
          {initialBill
            ? "Salvar alterações"
            : isFixed
              ? "Salvar custo fixo"
              : "Salvar boleto"}
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
