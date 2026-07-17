import {
  BarChart3,
  Bell,
  Calculator,
  CircleHelp,
  CreditCard,
  Home,
  ListChecks,
  ReceiptText,
  Settings,
  TrendingDown,
  TrendingUp
} from "lucide-react";

export const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/entradas", label: "Entradas", icon: TrendingUp },
  { href: "/despesas", label: "Saídas", icon: TrendingDown },
  { href: "/contas", label: "Contas", icon: ReceiptText },
  { href: "/precificacao", label: "Precificação", icon: Calculator },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/ajuda", label: "Ajuda", icon: CircleHelp },
  { href: "/configuracoes", label: "Configurações", icon: Settings }
];

export const quickActions = [
  { label: "Nova venda", icon: TrendingUp },
  { label: "Nova despesa", icon: CreditCard },
  { label: "Novo lembrete", icon: Bell },
  { label: "Precificar", icon: ListChecks }
];
