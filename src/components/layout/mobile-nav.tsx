"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Home, ReceiptText, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/entradas", label: "Entradas", icon: TrendingUp },
  { href: "/despesas", label: "Saídas", icon: TrendingDown },
  { href: "/contas", label: "Contas", icon: ReceiptText },
  { href: "/precificacao", label: "Preços", icon: Calculator }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-white/92 px-2 pb-3 pt-2 shadow-soft backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold text-muted transition",
                active && "bg-brand text-white shadow-sm"
              )}
            >
              <Icon size={18} />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
