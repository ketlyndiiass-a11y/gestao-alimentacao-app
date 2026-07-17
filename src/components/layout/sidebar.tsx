"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useStore } from "@/contexts/store-context";
import { cn } from "@/lib/utils";
import { navigation } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { activeStore } = useStore();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-line/80 bg-white/92 px-4 py-5 shadow-lift backdrop-blur lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
          <Menu size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted">Balcão no Lucro</p>
          <h1 className="truncate text-lg font-semibold">{activeStore.name}</h1>
        </div>
      </div>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
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
  );
}
