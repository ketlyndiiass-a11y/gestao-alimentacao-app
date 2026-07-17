import { TransactionPage } from "@/components/transactions/transaction-page";

export default function DespesasPage() {
  return (
    <TransactionPage
      type="despesa"
      title="Despesas"
      description="Cadastre compras, boletos pagos, fornecedores, embalagens e outros gastos."
    />
  );
}
