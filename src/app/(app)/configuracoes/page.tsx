"use client";

import { Building2, Check, CreditCard, Moon, Palette, Smartphone, Store, Sun, Trash2, UserCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/contexts/store-context";
import { useDeviceSessions } from "@/hooks/use-device-sessions";
import { useSubscription } from "@/hooks/use-subscription";
import { AppTheme, useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { plans } from "@/lib/plans";

const themes: Array<{
  value: AppTheme;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "Claro",
    description: "Visual mais limpo, com fundo claro e bastante contraste.",
    icon: Sun
  },
  {
    value: "neutral",
    label: "Neutro",
    description: "Tom mais suave para usar por bastante tempo no dia a dia.",
    icon: Palette
  },
  {
    value: "dark",
    label: "Escuro",
    description: "Interface mais escura para ambientes com pouca luz.",
    icon: Moon
  }
];

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { activeStore, stores } = useStore();
  const { plan: currentPlan, status } = useSubscription();
  const { devices, errorMessage: deviceErrorMessage, removeDevice } = useDeviceSessions();
  const { theme, setTheme } = useUserSettings();

  function handleThemeChange(nextTheme: AppTheme) {
    setTheme(nextTheme);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted">Conta e preferências</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Configurações</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <UserCircle size={23} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Usuário</p>
              <h2 className="text-lg font-semibold text-ink">Usuário do negócio</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoField label="Nome" value="Usuário do negócio" />
            <InfoField label="E-mail" value={user?.email ?? "A definir no cadastro"} />
            <InfoField label="CPF ou CNPJ" value="A definir no cadastro" />
            <InfoField label="Telefone" value="A definir no cadastro" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-brand">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Negócio</p>
              <h2 className="text-lg font-semibold text-ink">{activeStore.name}</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <InfoField label="Loja atual" value={activeStore.name} />
            <InfoField label="Tipo de negócio" value="Alimentação" />
            <InfoField label="Lojas cadastradas" value={`${stores.length} de ${currentPlan.storeLimit}`} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-brand">
              <Palette size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Tema da dashboard</p>
              <h2 className="text-lg font-semibold text-ink">Escolha o visual do aplicativo</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {themes.map((item) => {
              const Icon = item.icon;
              const selected = theme === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleThemeChange(item.value)}
                  className={cn(
                    "rounded-lg border border-line p-4 text-left transition hover:border-brand",
                    selected && "border-brand bg-canvas shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand">
                      <Icon size={18} />
                    </span>
                    {selected && <Check size={18} className="text-brand" />}
                  </div>
                  <strong className="mt-3 block text-ink">{item.label}</strong>
                  <p className="mt-1 text-sm text-muted">{item.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-brand">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Plano</p>
              <h2 className="text-lg font-semibold text-ink">Plano atual: {currentPlan.name}</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <InfoField label="Dispositivos liberados" value={`Até ${currentPlan.deviceLimit} dispositivos`} />
            <InfoField label="Lojas disponíveis" value={`Até ${currentPlan.storeLimit} loja`} />
            <InfoField label="Valor do plano" value={currentPlan.price} />
            <InfoField label="Status" value={status === "active" ? "Ativo" : "Pendente"} />
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted">Acessos</p>
            <h2 className="text-lg font-semibold text-ink">Dispositivos conectados</h2>
            <p className="mt-1 text-sm text-muted">
              Este plano permite até {currentPlan.deviceLimit} dispositivos.
            </p>
          </div>
          <span className="rounded-full bg-canvas px-3 py-1 text-sm font-semibold text-ink">
            {devices.length}/{currentPlan.deviceLimit}
          </span>
        </div>

        <div className="grid gap-3">
          {devices.length === 0 && (
            <p className="text-sm text-muted">Nenhum dispositivo registrado ainda.</p>
          )}

          {deviceErrorMessage && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              Não foi possível registrar este dispositivo: {deviceErrorMessage}
            </p>
          )}

          {devices.map((device) => (
            <div
              key={device.id}
              className="flex flex-col gap-3 rounded-lg border border-line bg-canvas px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">{device.deviceLabel}</p>
                <p className="text-sm text-muted">
                  Último acesso em {formatDateTime(device.lastSeenAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeDevice(device.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-danger"
              >
                <Trash2 size={15} />
                Remover
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted">Planos disponíveis</p>
          <h2 className="text-lg font-semibold text-ink">Limites por plano</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const selected = plan.id === currentPlan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-lg border border-line p-4",
                  selected && "border-brand bg-canvas"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted">{plan.highlight}</p>
                    <h3 className="mt-1 text-lg font-semibold text-ink">{plan.name}</h3>
                  </div>
                  {selected && (
                    <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                      Atual
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm font-semibold text-ink">{plan.price}</p>
                <div className="mt-4 grid gap-2 text-sm text-muted">
                  <span className="flex items-center gap-2">
                    <Store size={16} />
                    Até {plan.storeLimit} {plan.storeLimit === 1 ? "loja" : "lojas"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Smartphone size={16} />
                    Até {plan.deviceLimit} dispositivos
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-medium text-ink">{value}</p>
    </div>
  );
}
