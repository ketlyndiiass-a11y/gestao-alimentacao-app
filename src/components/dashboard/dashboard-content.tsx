"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Target, WalletCards } from "lucide-react";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { useStore } from "@/contexts/store-context";
import { useBills } from "@/hooks/use-bills";
import { useMonthlyTargets } from "@/hooks/use-monthly-targets";
import { useTransactions } from "@/hooks/use-transactions";
import { currency } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

type PeriodFilter = "today" | "7days" | "month" | "custom";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function isInPeriod(transaction: Transaction, filter: PeriodFilter, customMonth: string) {
  const now = new Date();
  const today = todayDate();

  if (filter === "today") {
    return transaction.date === today;
  }

  if (filter === "month") {
    return transaction.date.startsWith(currentMonth());
  }

  if (filter === "custom") {
    return transaction.date.startsWith(customMonth);
  }

  const transactionDate = parseLocalDate(transaction.date);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  return transactionDate >= start && transactionDate <= now;
}

function buildChartData(transactions: Transaction[], filter: PeriodFilter, customMonth: string) {
  const relevant = transactions.filter((transaction) =>
    isInPeriod(transaction, filter, customMonth)
  );

  const grouped = relevant.reduce<Record<string, { entradas: number; saidas: number }>>(
    (acc, transaction) => {
      const label = transaction.period === "yearly"
        ? transaction.date.slice(0, 4)
        : transaction.period === "monthly"
          ? transaction.date.slice(5, 7)
          : transaction.date.slice(8, 10);

      acc[label] ??= { entradas: 0, saidas: 0 };
      if (transaction.type === "entrada") {
        acc[label].entradas += transaction.amount;
      } else {
        acc[label].saidas += transaction.amount;
      }
      return acc;
    },
    {}
  );

  const entries = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, values]) => ({ label, ...values }));

  return entries.length ? entries : [{ label: "--", entradas: 0, saidas: 0 }];
}

export function DashboardContent() {
  const { activeStore } = useStore();
  const { allTransactions } = useTransactions();
  const { upcomingBills } = useBills();
  const { targets, saveTarget: saveMonthlyTarget } = useMonthlyTargets();
  const [filter, setFilter] = useState<PeriodFilter>("month");
  const [customMonth, setCustomMonth] = useState(currentMonth());
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  useEffect(() => {
    const targetMonth = filter === "custom" ? customMonth : currentMonth();
    setTargetInput(targets[targetMonth] ? formatMoneyInput(targets[targetMonth]) : "");
  }, [customMonth, filter, targets]);

  const filteredTransactions = useMemo(
    () => allTransactions.filter((transaction) => isInPeriod(transaction, filter, customMonth)),
    [allTransactions, customMonth, filter]
  );

  const totals = useMemo(() => {
    const revenue = filteredTransactions
      .filter((transaction) => transaction.type === "entrada")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = filteredTransactions
      .filter((transaction) => transaction.type === "despesa")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return { revenue, expenses, net: revenue - expenses };
  }, [filteredTransactions]);

  const chartData = useMemo(
    () => buildChartData(allTransactions, filter, customMonth),
    [allTransactions, customMonth, filter]
  );

  const targetMonth = filter === "custom" ? customMonth : currentMonth();
  const monthlyTarget = targets[targetMonth] ?? 0;
  const targetProgress = monthlyTarget
    ? Math.min((totals.revenue / monthlyTarget) * 100, 100)
    : 0;
  const remainingTarget = Math.max(monthlyTarget - totals.revenue, 0);

  const hasTodayEntry = allTransactions.some(
    (transaction) => transaction.type === "entrada" && transaction.date === todayDate()
  );

  const topExpenseItems = filteredTransactions
    .filter((transaction) => transaction.type === "despesa")
    .reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
      return acc;
    }, {});

  const topExpenses = Object.entries(topExpenseItems)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  async function saveTarget() {
    const value = parseMoney(targetInput);
    await saveMonthlyTarget(targetMonth, value);
    setEditingTarget(false);
  }

  function filterButton(value: PeriodFilter, label: string) {
    return (
      <button
        type="button"
        onClick={() => setFilter(value)}
        className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
          filter === value ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-white"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <section className="mb-5 overflow-hidden rounded-lg border border-line/80 bg-white/90 p-5 shadow-lift backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">Visão geral</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Dashboard</h2>
            <p className="mt-2 text-sm text-muted">{activeStore.name} em tempo real.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-4 rounded-lg border border-line/80 bg-canvas p-1">
              {filterButton("today", "Hoje")}
              {filterButton("7days", "7 dias")}
              {filterButton("month", "Mês")}
              {filterButton("custom", "Busca")}
            </div>
            {filter === "custom" && (
              <input
                className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                type="month"
                value={customMonth}
                onChange={(event) => setCustomMonth(event.target.value)}
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Entradas" value={currency(totals.revenue)} tone="success" />
        <MetricCard label="Saídas" value={currency(totals.expenses)} tone="danger" />
        <MetricCard
          label="Lucro líquido"
          value={currency(totals.net)}
          tone={totals.net >= 0 ? "success" : "danger"}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <WalletCards size={19} className="text-brand" />
                Entradas x saídas
              </h3>
              <p className="text-sm text-muted">Movimento financeiro do período selecionado.</p>
            </div>
            <div className="flex gap-3 text-sm font-medium">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-success" />
                Entradas
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-danger" />
                Saídas
              </span>
            </div>
          </div>
          <CashFlowChart data={chartData} />
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Target size={19} className="text-brand" />
                  Meta do mês
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {monthlyTarget ? `${currency(totals.revenue)} de ${currency(monthlyTarget)}` : "Defina uma meta para acompanhar o mês."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTarget((current) => !current)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold shadow-sm"
              >
                Editar
              </button>
            </div>
            {editingTarget && (
              <div className="mt-4 grid gap-2">
                <input
                  className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                  value={targetInput}
                  onChange={(event) => setTargetInput(event.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
                <button
                  type="button"
                  onClick={saveTarget}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  Salvar meta
                </button>
              </div>
            )}
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-brand" style={{ width: `${targetProgress}%` }} />
            </div>
            {monthlyTarget > 0 && (
              <p className="mt-2 text-sm text-muted">Faltam {currency(remainingTarget)}</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <CalendarDays size={19} className="text-brand" />
              Lançamento de hoje
            </h3>
            <p className="mt-2 text-sm text-muted">
              {hasTodayEntry
                ? "Entrada de hoje registrada."
                : "Você ainda não registrou vendas hoje."}
            </p>
            {!hasTodayEntry && (
              <Link
                href="/entradas"
                className="mt-3 inline-flex rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Registrar entrada
              </Link>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold text-ink">Contas próximas</h3>
            <div className="mt-4 space-y-3">
              {upcomingBills.length === 0 && (
                <p className="text-sm text-muted">Nenhuma conta próxima.</p>
              )}
              {upcomingBills.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2">
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-sm text-muted">Vence em {item.dueDate}</p>
                  </div>
                  <strong className="text-ink">{currency(item.amount)}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topExpenses.length === 0 ? (
          <Card className="p-4 md:col-span-2 xl:col-span-4">
            <p className="text-sm text-muted">Nenhuma saída registrada neste período.</p>
          </Card>
        ) : (
          topExpenses.map((item) => (
            <Card key={item.name} className="p-4">
              <p className="text-sm font-medium text-muted">{item.name}</p>
              <strong className="mt-2 block text-xl text-ink">{currency(item.value)}</strong>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
