import type { Bill } from "@/types/bill";

// Dados fictícios para testar contas e lembretes antes do Supabase.
export const initialBills: Bill[] = [
  {
    id: "bill-1",
    kind: "fixed",
    title: "Aluguel",
    category: "Custo fixo",
    amount: 1800,
    dueDate: "2026-07-10",
    status: "pendente",
    recurrence: "mensal"
  },
  {
    id: "bill-2",
    kind: "fixed",
    title: "Energia",
    category: "Custo fixo",
    amount: 620,
    dueDate: "2026-07-15",
    status: "pendente",
    recurrence: "mensal"
  },
  {
    id: "bill-3",
    kind: "bill",
    title: "Fornecedor de carnes",
    category: "Fornecedor",
    amount: 1450,
    dueDate: "2026-07-20",
    status: "pendente",
    recurrence: "unica"
  }
];
