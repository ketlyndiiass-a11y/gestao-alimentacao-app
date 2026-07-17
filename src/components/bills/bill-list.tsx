"use client";

import { useState } from "react";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";
import type { Bill } from "@/types/bill";
import { currency } from "@/lib/utils";

type PaymentInput = {
  paidAt: string;
  paymentMethod: string;
  bank?: string;
  amount?: number;
};

type BillListProps = {
  bills: Bill[];
  mode: "fixed" | "pending" | "paid";
  onPay?: (bill: Bill, payment: PaymentInput) => void;
  onEdit?: (bill: Bill) => void;
  onDelete?: (bill: Bill) => void;
};

const paymentMethods = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência", "Outro"];

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

function formatDate(date?: string) {
  if (!date) {
    return "";
  }

  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(year, month - 1, day));
}

export function BillList({ bills, mode, onPay, onEdit, onDelete }: BillListProps) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [bank, setBank] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  if (bills.length === 0) {
    return (
      <p className="text-muted">
        {mode === "paid"
          ? "Nenhuma conta paga ainda."
          : mode === "fixed"
            ? "Nenhum custo fixo cadastrado."
            : "Nenhum boleto pendente."}
      </p>
    );
  }

  function startPayment(bill: Bill) {
    setPayingId(bill.id);
    setPaidAt(today());
    setPaymentMethod(paymentMethods[0]);
    setBank("");
    setPaidAmount(formatMoneyInput(bill.amount));
  }

  function confirmPayment(bill: Bill) {
    onPay?.(bill, {
      paidAt,
      paymentMethod,
      bank: bank.trim(),
      amount: parseMoney(paidAmount) || bill.amount
    });
    setPayingId(null);
  }

  return (
    <div className="divide-y divide-line">
      {bills.map((bill) => (
        <div key={bill.id} className="grid gap-3 py-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="font-medium">{bill.title}</p>
              <p className="text-sm text-muted">
                {bill.category} • {bill.kind === "fixed" ? "custo fixo" : "boleto"} • vence em{" "}
                {formatDate(bill.dueDate)}
              </p>
              {bill.status === "paga" && (
                <p className="mt-1 text-sm text-muted">
                  Pago em {formatDate(bill.paidAt)} • {bill.paymentMethod}
                  {bill.bank ? ` • ${bill.bank}` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
              <strong>{currency(bill.amount)}</strong>
              {bill.status !== "paga" && (
                <button
                  type="button"
                  onClick={() => startPayment(bill)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
                >
                  <CheckCircle2 size={16} />
                  Marcar pago
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit?.(bill)}
                className="flex size-9 items-center justify-center rounded-lg border border-line bg-white"
                aria-label="Editar conta"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(bill)}
                className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-danger"
                aria-label="Excluir conta"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {payingId === bill.id && (
            <div className="rounded-lg border border-line bg-canvas p-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted">Valor pago</span>
                  <input
                    className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted">Data do pagamento</span>
                  <input
                    className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                    type="date"
                    value={paidAt}
                    onChange={(event) => setPaidAt(event.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted">Forma</span>
                  <select
                    className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    {paymentMethods.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-muted">Banco/conta</span>
                  <input
                    className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                    value={bank}
                    onChange={(event) => setBank(event.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => confirmPayment(bill)}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
                >
                  Confirmar pagamento
                </button>
                <button
                  type="button"
                  onClick={() => setPayingId(null)}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
