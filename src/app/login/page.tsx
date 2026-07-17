"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Store } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "forgot" | "newPassword";

export default function LoginPage() {
  const router = useRouter();
  const { loading, user, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && mode !== "newPassword") {
      router.replace("/");
    }
  }, [loading, mode, router, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (params.get("redefinir") === "1" || hash.includes("type=recovery")) {
      setMode("newPassword");
    }
  }, []);

  const title = useMemo(() => {
    if (mode === "signup") {
      return { eyebrow: "Primeiro acesso", heading: "Cadastro" };
    }

    if (mode === "forgot") {
      return { eyebrow: "Recuperar acesso", heading: "Esqueci minha senha" };
    }

    if (mode === "newPassword") {
      return { eyebrow: "Nova senha", heading: "Redefinir senha" };
    }

    return { eyebrow: "Acesse sua conta", heading: "Login" };
  }, [mode]);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "forgot") {
      const result = await resetPassword(normalizedEmail);
      setSubmitting(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage("Enviamos um link para seu e-mail. Abra o link para criar uma nova senha.");
      return;
    }

    if (mode === "newPassword") {
      const result = await updatePassword(password);
      setSubmitting(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage("Senha atualizada com sucesso. Agora entre usando sua nova senha.");
      setPassword("");
      setMode("signin");
      return;
    }

    const result =
      mode === "signin"
        ? await signIn(normalizedEmail, password)
        : await signUp(normalizedEmail, password);

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if ("activatedExisting" in result && result.activatedExisting) {
      router.replace("/");
      return;
    }

    if ("needsConfirmation" in result && result.needsConfirmation) {
      setMessage("Cadastro criado. Se o Supabase pedir confirmação, confirme pelo e-mail antes de entrar.");
      setMode("signin");
      return;
    }

    router.replace("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-line bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-canvas p-6 lg:p-8">
          <div className="flex size-12 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
            <Store size={25} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
            Gestão Alimentação
          </h1>
          <p className="mt-3 text-muted">
            Entre para controlar vendas, despesas, contas, precificação e relatórios do seu negócio.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-muted">
            <div className="rounded-lg bg-white px-4 py-3">
              Dados separados por loja e por usuário.
            </div>
            <div className="rounded-lg bg-white px-4 py-3">
              Planos Essencial, Gestão e Elite preparados no Supabase.
            </div>
            <div className="rounded-lg bg-white px-4 py-3">
              Acesso liberado conforme assinatura ativa.
            </div>
          </div>
        </section>

        <section className="p-6 lg:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-brand">{title.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">{title.heading}</h2>
          </div>

          <div
            className={cn(
              "mb-5 grid grid-cols-2 rounded-lg border border-line bg-canvas p-1",
              (mode === "forgot" || mode === "newPassword") && "hidden"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                clearFeedback();
              }}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold text-muted",
                mode === "signin" && "bg-white text-ink shadow-sm"
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                clearFeedback();
              }}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold text-muted",
                mode === "signup" && "bg-white text-ink shadow-sm"
              )}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {mode !== "newPassword" && (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">E-mail</span>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand">
                  <Mail size={18} className="text-muted" />
                  <input
                    className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="cliente@email.com"
                    required
                  />
                </div>
              </label>
            )}

            {mode !== "forgot" && (
              <label className="grid gap-2">
                <span className="text-sm font-medium text-muted">
                  {mode === "signup" || mode === "newPassword" ? "Criar senha" : "Senha"}
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand">
                  <LockKeyhole size={18} className="text-muted" />
                  <input
                    className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
                {(mode === "signup" || mode === "newPassword") && (
                  <span className="text-xs text-muted">
                    Crie uma senha com no mínimo 6 caracteres. Depois clique em{" "}
                    {mode === "signup" ? "Criar conta" : "Salvar nova senha"}.
                  </span>
                )}
              </label>
            )}

            {error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                {message}
              </div>
            )}

            <button
              className="rounded-lg bg-brand px-4 py-3 font-semibold text-white shadow-sm disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Aguarde..." : null}
              {!submitting && mode === "signin" ? "Entrar no aplicativo" : null}
              {!submitting && mode === "signup" ? "Criar conta" : null}
              {!submitting && mode === "forgot" ? "Enviar link de recuperação" : null}
              {!submitting && mode === "newPassword" ? "Salvar nova senha" : null}
            </button>
          </form>

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                clearFeedback();
              }}
              className="mt-4 text-sm font-semibold text-brand hover:underline"
            >
              Esqueci minha senha
            </button>
          )}

          {(mode === "forgot" || mode === "newPassword") && (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                clearFeedback();
              }}
              className="mt-4 text-sm font-semibold text-brand hover:underline"
            >
              Voltar para o login
            </button>
          )}

          {mode === "signup" && (
            <p className="mt-5 text-sm text-muted">
              Após a compra, use o mesmo e-mail do checkout em &quot;Criar conta&quot; para definir sua senha.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
