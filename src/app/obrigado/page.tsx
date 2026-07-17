import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound, Mail, MessageCircle, ShieldCheck, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Compra confirmada | Balcão no Lucro",
  description: "Acesse o Balcão no Lucro depois da confirmação da sua assinatura."
};

const steps = [
  {
    title: "Use o mesmo e-mail da compra",
    description: "Na tela de acesso, clique em Criar conta e informe o e-mail usado no checkout.",
    icon: Mail
  },
  {
    title: "Crie sua senha",
    description: "Defina uma senha com no mínimo 6 caracteres para liberar seu primeiro acesso.",
    icon: KeyRound
  },
  {
    title: "Entre no aplicativo",
    description: "Depois do cadastro, você já pode lançar vendas, despesas, contas e precificar produtos.",
    icon: ShieldCheck
  }
];

export default function ObrigadoPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          <div className="bg-brand px-6 py-7 text-white lg:px-8">
            <div className="flex size-12 items-center justify-center rounded-lg bg-white/15">
              <Store size={26} />
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-white/80">
              Compra confirmada
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Seja bem-vindo ao Balcão no Lucro
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
              Sua assinatura foi recebida. Agora é só criar o acesso usando o mesmo e-mail da compra para começar a organizar o financeiro do seu negócio.
            </p>
          </div>

          <div className="grid gap-4 p-6 lg:p-8">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="flex gap-4 rounded-lg border border-line bg-canvas p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Passo {index + 1}
                    </p>
                    <h2 className="mt-1 font-semibold text-ink">{step.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft lg:p-7">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-success" size={26} />
              <div>
                <p className="text-sm font-semibold text-brand">Próximo passo</p>
                <h2 className="text-xl font-semibold text-ink">Criar acesso</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              Clique no botão abaixo, vá em Criar conta e use o mesmo e-mail informado no checkout da Kiwify.
            </p>

            <Link
              href="/login"
              className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 font-semibold text-white shadow-sm transition hover:brightness-95"
            >
              Acessar aplicativo
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-lg border border-line bg-white p-6 shadow-soft lg:p-7">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-brand" size={24} />
              <h2 className="text-lg font-semibold text-ink">Precisa de ajuda?</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              Se tiver qualquer dificuldade para acessar, fale com o suporte. Em breve este botão abrirá o WhatsApp oficial.
            </p>
            <button className="mt-5 w-full rounded-lg border border-line px-4 py-3 font-semibold text-ink">
              Suporte via WhatsApp
            </button>
          </div>

          <div className="rounded-lg border border-line bg-canvas p-5 text-sm leading-6 text-muted">
            Se o pagamento ainda estiver processando, aguarde alguns minutos e tente criar a conta novamente com o e-mail da compra.
          </div>
        </aside>
      </div>
    </main>
  );
}
