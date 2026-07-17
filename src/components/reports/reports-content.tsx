"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, PackageCheck, ReceiptText, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { useBills } from "@/hooks/use-bills";
import { usePricedProducts } from "@/hooks/use-priced-products";
import { useTransactions } from "@/hooks/use-transactions";
import { calculateProductPricing } from "@/lib/pricing";
import { cn, currency } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function previousMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 2, 1);
  return date.toISOString().slice(0, 7);
}

function monthName(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, monthIndex - 1, 1));
}

function transactionsForMonth(transactions: Transaction[], month: string) {
  return transactions.filter((transaction) => {
    if (transaction.period === "yearly") {
      return false;
    }

    return transaction.date.startsWith(month);
  });
}

function summarize(transactions: Transaction[]) {
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
}

function percentageChange(current: number, previous: number) {
  if (!previous && !current) {
    return 0;
  }

  if (!previous) {
    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function groupedExpenses(transactions: Transaction[]) {
  return Object.entries(
    transactions
      .filter((transaction) => transaction.type === "despesa")
      .reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
        return acc;
      }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function groupedRevenue(transactions: Transaction[]) {
  return Object.entries(
    transactions
      .filter((transaction) => transaction.type === "entrada")
      .reduce<Record<string, number>>((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
        return acc;
      }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function ReportsContent() {
  const { allTransactions } = useTransactions();
  const { bills, totals } = useBills();
  const { products } = usePricedProducts();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const report = useMemo(() => {
    const currentTransactions = transactionsForMonth(allTransactions, selectedMonth);
    const previousTransactions = transactionsForMonth(allTransactions, previousMonth(selectedMonth));
    const current = summarize(currentTransactions);
    const previous = summarize(previousTransactions);
    const expenseRanking = groupedExpenses(currentTransactions);
    const revenueRanking = groupedRevenue(currentTransactions);
    const productRanking = products
      .map((product) => {
        const pricing = calculateProductPricing(product);
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          counterProfit: pricing.counterProfit,
          ifoodProfit: pricing.ifoodProfit,
          marginPercent: product.marginPercent,
          totalCost: pricing.totalCost
        };
      })
      .sort((a, b) => b.counterProfit - a.counterProfit)
      .slice(0, 5);
    const pendingBills = bills
      .filter((bill) => bill.status !== "paga")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    return {
      current,
      previous,
      expenseRanking,
      revenueRanking,
      productRanking,
      pendingBills
    };
  }, [allTransactions, bills, products, selectedMonth]);

  const netTone = report.current.net >= 0 ? "success" : "danger";
  const netChange = percentageChange(report.current.net, report.previous.net);
  const revenueChange = percentageChange(report.current.revenue, report.previous.revenue);
  const expenseChange = percentageChange(report.current.expenses, report.previous.expenses);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <section className="mb-5 overflow-hidden rounded-lg border border-line/80 bg-white/90 p-5 shadow-lift backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">Análise do negócio</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Relatórios</h1>
            <p className="mt-2 text-sm text-muted">
              Veja onde o dinheiro entrou, para onde saiu e quais produtos merecem atenção.
            </p>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-muted">Período</span>
            <input
              className="rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Entradas do mês" value={currency(report.current.revenue)} tone="success" />
        <MetricCard label="Saídas do mês" value={currency(report.current.expenses)} tone="danger" />
        <MetricCard label="Resultado líquido" value={currency(report.current.net)} tone={netTone} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Comparativo mensal</h2>
              <p className="text-sm text-muted">
                {monthName(selectedMonth)} comparado com {monthName(previousMonth(selectedMonth))}.
              </p>
            </div>
            <CalendarDays className="text-brand" size={22} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ComparisonCard label="Entradas" value={revenueChange} current={report.current.revenue} previous={report.previous.revenue} goodWhenUp />
            <ComparisonCard label="Saídas" value={expenseChange} current={report.current.expenses} previous={report.previous.expenses} />
            <ComparisonCard label="Lucro líquido" value={netChange} current={report.current.net} previous={report.previous.net} goodWhenUp />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ReceiptText className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-ink">Contas</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <InfoLine label="Custo fixo mensal" value={currency(totals.monthlyFixed)} />
            <InfoLine label="Boletos pendentes" value={currency(totals.pending)} />
            <InfoLine label="Contas pagas" value={currency(totals.paid)} />
          </div>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <RankingCard
          title="Maiores gastos"
          description="Categorias que mais consumiram dinheiro no período."
          items={report.expenseRanking}
          emptyText="Nenhuma saída registrada neste mês."
          tone="danger"
        />
        <RankingCard
          title="Entradas por categoria"
          description="De onde veio o faturamento do período."
          items={report.revenueRanking}
          emptyText="Nenhuma entrada registrada neste mês."
          tone="success"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="text-brand" size={20} />
            <div>
              <h2 className="text-lg font-semibold text-ink">Produtos mais lucrativos</h2>
              <p className="text-sm text-muted">
                Ranking baseado no lucro estimado de balcão da precificação.
              </p>
            </div>
          </div>

          {report.productRanking.length === 0 ? (
            <p className="text-sm text-muted">Nenhum produto precificado ainda.</p>
          ) : (
            <div className="divide-y divide-line">
              {report.productRanking.map((product, index) => (
                <div key={product.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-brand">#{index + 1}</p>
                    <h3 className="font-semibold text-ink">{product.name}</h3>
                    <p className="text-sm text-muted">
                      {product.category} • custo {currency(product.totalCost)} • margem {product.marginPercent}%
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left text-sm md:text-right">
                    <div>
                      <p className="text-muted">Balcão</p>
                      <strong className="text-success">{currency(product.counterProfit)}</strong>
                    </div>
                    <div>
                      <p className="text-muted">iFood</p>
                      <strong className="text-success">{currency(product.ifoodProfit)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <PackageCheck className="text-brand" size={20} />
            <h2 className="text-lg font-semibold text-ink">Próximas pendências</h2>
          </div>

          {report.pendingBills.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma conta pendente cadastrada.</p>
          ) : (
            <div className="grid gap-3">
              {report.pendingBills.map((bill) => (
                <div key={bill.id} className="rounded-lg border border-line bg-canvas px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{bill.title}</p>
                      <p className="text-sm text-muted">Vence em {bill.dueDate}</p>
                    </div>
                    <strong className="text-ink">{currency(bill.amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function ComparisonCard({
  label,
  value,
  current,
  previous,
  goodWhenUp = false
}: {
  label: string;
  value: number;
  current: number;
  previous: number;
  goodWhenUp?: boolean;
}) {
  const positive = value >= 0;
  const good = goodWhenUp ? positive : !positive;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-lg border border-line bg-canvas p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-ink">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            good ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}
        >
          <Icon size={17} />
        </span>
      </div>
      <strong className={cn("mt-3 block text-2xl", good ? "text-success" : "text-danger")}>
        {value.toFixed(1).replace(".", ",")}%
      </strong>
      <p className="mt-2 text-sm text-muted">
        Atual {currency(current)} • anterior {currency(previous)}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  description,
  items,
  emptyText,
  tone
}: {
  title: string;
  description: string;
  items: Array<{ name: string; value: number }>;
  emptyText: string;
  tone: "success" | "danger";
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="grid gap-3">
          {items.slice(0, 5).map((item) => {
            const percent = total ? Math.round((item.value / total) * 100) : 0;

            return (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-medium text-ink">{item.name}</span>
                  <strong className={tone === "success" ? "text-success" : "text-danger"}>
                    {currency(item.value)}
                  </strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-danger")}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2">
      <span className="text-sm text-muted">{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}
