import { Edit2, Trash2 } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { currency } from "@/lib/utils";

type TransactionListProps = {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

function formatTransactionDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(parsed);
}

function transactionTitle(transaction: Transaction) {
  if (transaction.period === "monthly") {
    return transaction.type === "entrada" ? "Vendas do mês" : "Saídas do mês";
  }

  if (transaction.period === "yearly") {
    return transaction.type === "entrada" ? "Vendas do ano" : "Saídas do ano";
  }

  return transaction.type === "entrada" ? "Vendas gerais" : transaction.description;
}

function transactionSubtitle(transaction: Transaction) {
  if (transaction.periodLabel) {
    return transaction.periodLabel;
  }

  return formatTransactionDate(transaction.date);
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-muted">Nenhum lançamento cadastrado ainda.</p>;
  }

  return (
    <div className="divide-y divide-line">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="font-medium">{transactionTitle(transaction)}</p>
            <p className="text-sm text-muted">{transactionSubtitle(transaction)}</p>
          </div>

          <div className="flex items-center gap-3">
            <strong
              className={transaction.type === "entrada" ? "text-success" : "text-danger"}
            >
              {transaction.type === "entrada" ? "+" : "-"}
              {currency(transaction.amount)}
            </strong>
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="flex size-9 items-center justify-center rounded-lg border border-line bg-white"
              aria-label="Editar lançamento"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-danger"
              aria-label="Excluir lançamento"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
