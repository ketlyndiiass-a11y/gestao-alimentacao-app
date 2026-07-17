export type TransactionType = "entrada" | "despesa";
export type TransactionPeriod = "daily" | "monthly" | "yearly";

export type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  date: string;
  period?: TransactionPeriod;
  periodLabel?: string;
  paymentMethod?: string;
  businessHours?: string;
  notes?: string;
};

export type TransactionInput = Omit<Transaction, "id">;
