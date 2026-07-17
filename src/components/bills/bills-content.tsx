"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BillForm } from "@/components/bills/bill-form";
import { BillList } from "@/components/bills/bill-list";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { useBills } from "@/hooks/use-bills";
import { useTransactions } from "@/hooks/use-transactions";
import { currency } from "@/lib/utils";
import type { Bill, BillInput, BillKind } from "@/types/bill";

type Tab = "fixed" | "bills" | "paid";

export function BillsContent() {
  const { bills, totals, addBill, updateBill, deleteBill, markBillPaid } = useBills();
  const { addTransaction } = useTransactions("despesa");
  const [activeTab, setActiveTab] = useState<Tab>("fixed");
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const fixedBills = useMemo(
    () => bills.filter((bill) => bill.kind === "fixed"),
    [bills]
  );
  const pendingBills = useMemo(
    () => bills.filter((bill) => bill.kind === "bill" && bill.status !== "paga"),
    [bills]
  );
  const paidBills = useMemo(
    () => bills.filter((bill) => bill.status === "paga"),
    [bills]
  );

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    setShowForm(false);
    setEditingBill(null);
  }

  function openCreateForm() {
    setEditingBill(null);
    setShowForm((current) => !current);
  }

  function handleEdit(bill: Bill) {
    setActiveTab(bill.kind === "fixed" ? "fixed" : "bills");
    setEditingBill(bill);
    setShowForm(true);
  }

  function handleDelete(bill: Bill) {
    const confirmed = window.confirm(`Deseja excluir "${bill.title}"?`);

    if (confirmed) {
      deleteBill(bill.id);
    }
  }

  async function handleSubmit(input: BillInput) {
    if (editingBill) {
      await updateBill(editingBill.id, input);
      setEditingBill(null);
    } else {
      await addBill(input);
    }

    setShowForm(false);
  }

  async function handlePay(
    bill: Bill,
    payment: { paidAt: string; paymentMethod: string; bank?: string; amount?: number }
  ) {
    const paidBill = await markBillPaid(bill.id, payment);

    if (!paidBill) {
      return;
    }

    await addTransaction({
      type: "despesa",
      description: paidBill.title,
      category: paidBill.kind === "fixed" ? "Conta fixa" : "Boleto",
      amount: paidBill.amount,
      date: payment.paidAt,
      paymentMethod: payment.paymentMethod,
      notes: payment.bank ? `Pago via ${payment.bank}` : "Gerado pela aba Contas"
    });
  }

  function tabButton(tab: Tab, label: string) {
    return (
      <button
        type="button"
        onClick={() => changeTab(tab)}
        className={`rounded-md px-3 py-2 text-sm font-semibold ${
          activeTab === tab ? "bg-white shadow-sm" : "text-muted"
        }`}
      >
        {label}
      </button>
    );
  }

  const formKind: BillKind = editingBill?.kind ?? (activeTab === "bills" ? "bill" : "fixed");
  const formTitle =
    activeTab === "fixed"
      ? editingBill
        ? "Editar custo fixo"
        : "Adicionar custo fixo"
      : editingBill
        ? "Editar boleto"
        : "Adicionar boleto";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <p className="text-sm font-medium text-muted">Financeiro</p>
      <h2 className="mt-1 text-2xl font-semibold text-ink">Contas</h2>
      <p className="mt-2 max-w-2xl text-muted">
        Custos fixos entram na precificação. Contas pagas entram automaticamente em Saídas.
      </p>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Custo fixo mensal"
          value={currency(totals.monthlyFixed)}
          tone="default"
        />
        <MetricCard label="Boletos pendentes" value={currency(totals.pending)} tone="danger" />
        <MetricCard label="Contas pagas" value={currency(totals.paid)} tone="success" />
      </section>

      <div className="mt-5 grid grid-cols-3 rounded-lg border border-line bg-canvas p-1">
        {tabButton("fixed", "Custos fixos")}
        {tabButton("bills", "Boletos")}
        {tabButton("paid", "Pagas")}
      </div>

      {activeTab !== "paid" && (
        <section className="mt-5">
          {!showForm ? (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white"
            >
              <Plus size={18} />
              {activeTab === "fixed" ? "Adicionar custo fixo" : "Adicionar boleto"}
            </button>
          ) : (
            <Card className="p-5">
              <h3 className="mb-4 text-lg font-semibold">{formTitle}</h3>
              <BillForm
                kind={formKind}
                initialBill={editingBill}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingBill(null);
                }}
              />
            </Card>
          )}
        </section>
      )}

      <Card className="mt-5 p-5">
        <h3 className="mb-2 text-lg font-semibold">
          {activeTab === "fixed"
            ? "Custos fixos mensais"
            : activeTab === "bills"
              ? "Boletos a vencer"
              : "Contas pagas"}
        </h3>
        <p className="mb-3 text-sm text-muted">
          {activeTab === "fixed"
            ? "Somente estes valores entram no cálculo da precificação."
            : activeTab === "bills"
              ? "Boletos e contas eventuais para controlar vencimentos."
              : "Histórico do que já foi pago e enviado para Saídas."}
        </p>
        <BillList
          mode={activeTab === "fixed" ? "fixed" : activeTab === "bills" ? "pending" : "paid"}
          bills={
            activeTab === "fixed"
              ? fixedBills
              : activeTab === "bills"
                ? pendingBills
                : paidBills
          }
          onPay={handlePay}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
