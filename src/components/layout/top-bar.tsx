"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  CreditCard,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Save,
  Settings,
  Store,
  UserCircle,
  X
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useStore } from "@/contexts/store-context";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-items";

export function TopBar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { plan: currentPlan } = useSubscription();
  const { stores, activeStore, activeStoreId, setActiveStoreId, addStore, renameStore } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreName, setEditingStoreName] = useState("");
  const reachedStoreLimit = stores.length >= currentPlan.storeLimit;
  const businessUserName = user?.email ?? "Usuário do negócio";

  function openMenu() {
    setProfileOpen(false);
    setMenuOpen(true);
  }

  function toggleProfile() {
    setMenuOpen(false);
    setProfileOpen((current) => !current);
  }

  function handleAddStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (reachedStoreLimit) {
      return;
    }

    addStore(newStoreName);
    setNewStoreName("");
  }

  function startEditingStore(store: { id: string; name: string }) {
    setEditingStoreId(store.id);
    setEditingStoreName(store.name);
  }

  function saveStoreName() {
    if (!editingStoreId) {
      return;
    }

    renameStore(editingStoreId, editingStoreName);
    setEditingStoreId(null);
    setEditingStoreName("");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/88 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <button
          type="button"
          onClick={openMenu}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-sm transition active:scale-95 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-line/80 bg-canvas/90 p-1 shadow-sm">
          <Link
            href="/"
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-center text-sm font-semibold text-muted transition",
              pathname !== "/precificacao" && "bg-white text-ink shadow-sm"
            )}
          >
            Financeiro
          </Link>
          <Link
            href="/precificacao"
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-center text-sm font-semibold text-muted transition",
              pathname === "/precificacao" && "bg-white text-ink shadow-sm"
            )}
          >
            Produtos
          </Link>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={toggleProfile}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg text-white shadow-sm transition active:scale-95",
              profileOpen ? "bg-ink" : "bg-brand"
            )}
            aria-label="Abrir perfil"
            aria-expanded={profileOpen}
          >
            <UserCircle size={21} />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Fechar perfil"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                onClick={() => setProfileOpen(false)}
              />

              <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line/80 bg-white shadow-soft">
                <div className="bg-canvas px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                      <UserCircle size={23} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Perfil</p>
                      <h3 className="truncate font-semibold text-ink">{businessUserName}</h3>
                      <p className="truncate text-sm text-muted">Usuário autenticado</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="rounded-lg border border-line bg-white p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted">
                      <Building2 size={16} />
                      Loja atual
                    </div>
                    <strong className="mt-1 block truncate text-ink">{activeStore.name}</strong>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-ink">Lojas do negócio</p>
                    <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
                      {stores.map((store) => {
                        const selected = store.id === activeStoreId;
                        const editing = store.id === editingStoreId;

                        if (editing) {
                          return (
                            <div key={store.id} className="rounded-lg border border-brand bg-canvas p-2">
                              <input
                                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                                value={editingStoreName}
                                onChange={(event) => setEditingStoreName(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    saveStoreName();
                                  }
                                }}
                                autoFocus
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveStoreName}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
                                >
                                  <Save size={16} />
                                  Salvar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingStoreId(null)}
                                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={store.id}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border border-line px-2 py-2 transition",
                              selected && "border-brand bg-canvas"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveStoreId(store.id)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                            >
                              <Store size={16} className="shrink-0 text-muted" />
                              <span className={cn("truncate", selected && "font-semibold text-ink")}>
                                {store.name}
                              </span>
                              {selected && <Check size={16} className="ml-auto shrink-0 text-brand" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditingStore(store)}
                              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-ink"
                              aria-label={`Editar ${store.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleAddStore} className="mt-3 flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                      value={newStoreName}
                      onChange={(event) => setNewStoreName(event.target.value)}
                      placeholder={reachedStoreLimit ? "Limite do plano atingido" : "Nova loja"}
                      disabled={reachedStoreLimit}
                    />
                    <button
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg text-white",
                        reachedStoreLimit ? "bg-muted/50" : "bg-brand"
                      )}
                      aria-label="Adicionar loja"
                      disabled={reachedStoreLimit}
                    >
                      <Plus size={18} />
                    </button>
                  </form>
                  {reachedStoreLimit && (
                    <p className="mt-2 text-xs text-muted">
                      Plano {currentPlan.name}: até {currentPlan.storeLimit} loja e {currentPlan.deviceLimit} dispositivos.
                    </p>
                  )}
                </div>

                <div className="border-t border-line p-2">
                  <Link
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
                    href="/configuracoes"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings size={17} />
                    Configurações
                  </Link>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-canvas"
                    type="button"
                  >
                    <CreditCard size={17} />
                    Plano atual: {currentPlan.name}
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted hover:bg-canvas"
                    type="button"
                    onClick={signOut}
                  >
                    <LogOut size={17} />
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-ink/45"
            onClick={() => setMenuOpen(false)}
          />

          <aside className="absolute left-0 top-0 flex h-dvh w-[min(20rem,86vw)] flex-col overflow-hidden rounded-r-lg bg-white shadow-soft">
            <div className="border-b border-line/80 bg-canvas px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Menu</p>
                  <h2 className="truncate font-semibold text-ink">{activeStore.name}</h2>
                  <p className="truncate text-sm text-muted">{businessUserName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-muted transition hover:bg-canvas hover:text-ink",
                      active && "bg-brand text-white shadow-sm hover:bg-brand hover:text-white"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
