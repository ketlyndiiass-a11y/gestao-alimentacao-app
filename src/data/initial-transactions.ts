import type { Transaction } from "@/types/transaction";

// Dados fictícios para testar o app antes da integração com Supabase.
export const initialTransactions: Transaction[] = [
  {
    id: "entrada-1",
    type: "entrada",
    description: "Vendas gerais",
    category: "Geral",
    amount: 1840,
    date: "2026-07-01",
    paymentMethod: "Pix"
  },
  {
    id: "entrada-2",
    type: "entrada",
    description: "Vendas gerais",
    category: "Delivery",
    amount: 1260,
    date: "2026-07-03",
    paymentMethod: "iFood"
  },
  {
    id: "despesa-1",
    type: "despesa",
    description: "Compra de insumos",
    category: "Insumos",
    amount: 780,
    date: "2026-07-04",
    paymentMethod: "Cartão"
  },
  {
    id: "despesa-2",
    type: "despesa",
    description: "Embalagens",
    category: "Embalagens",
    amount: 360,
    date: "2026-07-05",
    paymentMethod: "Pix"
  },
  {
    id: "entrada-3",
    type: "entrada",
    description: "Vendas gerais",
    category: "Geral",
    amount: 2140,
    date: "2026-07-08",
    paymentMethod: "Dinheiro"
  },
  {
    id: "despesa-3",
    type: "despesa",
    description: "Energia",
    category: "Conta fixa",
    amount: 620,
    date: "2026-07-10",
    paymentMethod: "Boleto"
  }
];
