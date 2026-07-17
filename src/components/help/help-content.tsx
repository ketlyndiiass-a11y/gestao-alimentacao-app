import Link from "next/link";
import {
  BarChart3,
  Calculator,
  CircleHelp,
  MessageCircle,
  PlayCircle,
  ReceiptText,
  Settings,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";

const helpSections = [
  {
    title: "Dashboard",
    icon: BarChart3,
    description:
      "Acompanhe entradas, saídas, lucro líquido, meta do mês, contas próximas e maiores gastos.",
    steps: [
      "Use os filtros Hoje, 7 dias, Mês ou Busca para mudar o período.",
      "Cadastre a meta do mês para acompanhar quanto ainda falta vender.",
      "Use o botão Registrar entrada quando ainda não lançou as vendas do dia."
    ]
  },
  {
    title: "Entradas",
    icon: TrendingUp,
    description:
      "Registre tudo que entrou no negócio, como vendas no balcão, delivery, iFood, eventos e outros recebimentos.",
    steps: [
      "Escolha Hoje ou Personalizado.",
      "Informe o valor da venda e, se quiser, categoria e forma de pagamento.",
      "Use Lançamentos anteriores para cadastrar um mês ou ano que já estava em planilha."
    ]
  },
  {
    title: "Saídas",
    icon: TrendingDown,
    description:
      "Registre compras, despesas, boletos pagos e qualquer valor que saiu do caixa.",
    steps: [
      "Cadastre a descrição, valor, data, categoria e forma de pagamento.",
      "Consulte por mês e dia para revisar os lançamentos.",
      "Edite ou exclua lançamentos quando precisar corrigir alguma informação."
    ]
  },
  {
    title: "Contas",
    icon: ReceiptText,
    description:
      "Controle custos fixos mensais, boletos pendentes e contas já pagas.",
    steps: [
      "Cadastre aluguel, energia, funcionário e outros custos fixos na aba Custos fixos.",
      "Cadastre boletos eventuais na aba Boletos.",
      "Quando marcar uma conta como paga, ela também entra automaticamente em Saídas."
    ]
  },
  {
    title: "Precificação",
    icon: Calculator,
    description:
      "Calcule o preço de marmitas, lanches, pizzas e outros produtos considerando insumos, embalagem, custos fixos, margem e iFood.",
    steps: [
      "Clique em Cadastrar produto.",
      "Adicione cada ingrediente informando quanto comprou, quanto pagou e quanto usa no produto.",
      "Informe embalagem, previsão de vendas, margem de lucro e taxa do iFood.",
      "Salve o produto para ele aparecer dentro da categoria escolhida."
    ]
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    description:
      "Veja uma análise mais completa do negócio, com comparativo mensal, maiores gastos, entradas por categoria e produtos mais lucrativos.",
    steps: [
      "Escolha o mês que deseja consultar.",
      "Compare entradas, saídas e lucro com o mês anterior.",
      "Use os rankings para entender onde está gastando mais e quais produtos têm melhor margem."
    ]
  },
  {
    title: "Configurações",
    icon: Settings,
    description:
      "Consulte dados do usuário, loja atual, plano contratado e escolha o tema visual do aplicativo.",
    steps: [
      "Escolha entre tema claro, neutro ou escuro.",
      "Veja os limites do plano atual.",
      "Use o perfil para trocar ou renomear lojas disponíveis no plano."
    ]
  }
];

export function HelpContent() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <section className="mb-5 overflow-hidden rounded-lg border border-line/80 bg-white/90 p-5 shadow-lift backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">Central de suporte</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Ajuda</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Aprenda como usar cada área do aplicativo para controlar vendas, despesas,
              contas, precificação e relatórios do negócio.
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
            <CircleHelp size={25} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <PlayCircle className="text-brand" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-ink">Vídeo explicativo</h2>
              <p className="text-sm text-muted">
                Espaço reservado para colocar o vídeo ensinando a usar o aplicativo.
              </p>
            </div>
          </div>

          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-line bg-canvas text-center">
            <div className="max-w-sm px-4">
              <PlayCircle className="mx-auto text-brand" size={38} />
              <h3 className="mt-3 font-semibold text-ink">Adicione seu vídeo aqui</h3>
              <p className="mt-1 text-sm text-muted">
                Depois podemos trocar este espaço por um vídeo do YouTube, Vimeo ou arquivo hospedado.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="text-brand" size={22} />
            <h2 className="text-lg font-semibold text-ink">Suporte</h2>
          </div>
          <p className="text-sm text-muted">
            Se o usuário precisar de ajuda, ele poderá clicar no botão abaixo para falar com o suporte.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white shadow-sm"
          >
            <MessageCircle size={18} />
            Falar com suporte
          </a>
          <p className="mt-3 text-xs text-muted">
            Link do WhatsApp ainda não configurado.
          </p>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.title} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                </div>
              </div>

              <ol className="mt-4 grid gap-2">
                {section.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 rounded-lg bg-canvas px-3 py-2 text-sm text-muted">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          );
        })}
      </section>

      <Card className="mt-5 p-5">
        <h2 className="text-lg font-semibold text-ink">Começo recomendado</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <QuickLink href="/contas" title="1. Cadastre os custos fixos" />
          <QuickLink href="/entradas" title="2. Lance as vendas do dia" />
          <QuickLink href="/precificacao" title="3. Precifique seus produtos" />
        </div>
      </Card>
    </div>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-line bg-canvas px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand"
    >
      {title}
    </Link>
  );
}
