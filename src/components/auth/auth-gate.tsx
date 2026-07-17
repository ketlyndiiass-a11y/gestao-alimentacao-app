"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useDeviceAccess } from "@/hooks/use-device-access";
import { useDeviceSessions } from "@/hooks/use-device-sessions";
import { useSubscription } from "@/hooks/use-subscription";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, signOut, user } = useAuth();
  const subscription = useSubscription();
  const deviceAccess = useDeviceAccess(subscription.plan.deviceLimit, Boolean(user && subscription.hasAccess));
  const deviceSessions = useDeviceSessions({
    registerCurrentDevice: deviceAccess.allowed
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || (user && subscription.loading) || (user && subscription.hasAccess && deviceAccess.loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="rounded-lg border border-line bg-white p-5 text-center shadow-lift">
          <p className="font-semibold text-ink">Carregando acesso...</p>
          <p className="mt-1 text-sm text-muted">Validando sua sessão, assinatura e dispositivo.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!subscription.hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="max-w-md rounded-lg border border-line bg-white p-6 text-center shadow-lift">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Acesso pendente</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Assinatura não ativa</h1>
          <p className="mt-3 text-sm text-muted">
            Esta conta ainda não tem um plano ativo liberado. Assim que o pagamento for confirmado,
            o acesso será ativado automaticamente.
          </p>
          <div className="mt-4 rounded-lg bg-canvas px-3 py-2 text-left text-xs text-muted">
            <p>E-mail: {user.email ?? "não identificado"}</p>
            <p>Status recebido: {subscription.status}</p>
            <p>Plano recebido: {subscription.plan.name}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="mt-5 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  if (!deviceAccess.allowed && deviceAccess.deviceCount >= subscription.plan.deviceLimit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
        <div className="w-full max-w-lg rounded-lg border border-line bg-white p-6 text-center shadow-lift">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Limite atingido</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Dispositivos excedidos</h1>
          <p className="mt-3 text-sm text-muted">
            O plano {subscription.plan.name} permite até {subscription.plan.deviceLimit} dispositivos.
            Esta conta já tem {deviceAccess.deviceCount} dispositivo(s) registrado(s).
          </p>
          <p className="mt-2 text-sm text-muted">
            Remova um dispositivo antigo abaixo e clique em tentar acessar novamente.
          </p>

          <div className="mt-5 grid gap-3 text-left">
            {deviceSessions.loading ? (
              <div className="rounded-lg border border-line bg-canvas px-3 py-3 text-sm text-muted">
                Carregando dispositivos...
              </div>
            ) : null}

            {!deviceSessions.loading && !deviceSessions.devices.length ? (
              <div className="rounded-lg border border-line bg-canvas px-3 py-3 text-sm text-muted">
                Nenhum dispositivo encontrado. Tente acessar novamente.
              </div>
            ) : null}

            {deviceSessions.devices.map((device) => (
              <div key={device.id} className="rounded-lg border border-line bg-canvas px-3 py-3">
                <p className="font-semibold text-ink">{device.deviceLabel}</p>
                <p className="mt-1 text-xs text-muted">
                  Último acesso em {new Date(device.lastSeenAt).toLocaleString("pt-BR")}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await deviceSessions.removeDevice(device.id);
                    await deviceSessions.reloadDevices();
                  }}
                  className="mt-3 w-full rounded-lg border border-danger/30 bg-white px-3 py-2 text-sm font-semibold text-danger"
                >
                  Remover este dispositivo
                </button>
              </div>
            ))}
          </div>

          {deviceSessions.errorMessage ? (
            <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {deviceSessions.errorMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              deviceAccess.retry();
            }}
            className="mt-5 w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white"
          >
            Tentar acessar novamente
          </button>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            className="mt-3 w-full rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
