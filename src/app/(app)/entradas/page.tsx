import { TransactionPage } from "@/components/transactions/transaction-page";

export default function EntradasPage() {
  return (
    <TransactionPage
      type="entrada"
      title="Entradas"
      description="Cadastre rapidamente o valor vendido no dia, consulte meses anteriores e acompanhe suas vendas."
    />
  );
}
