import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex">
        <Sidebar />
        <main className="min-h-screen flex-1 pb-24 lg:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
