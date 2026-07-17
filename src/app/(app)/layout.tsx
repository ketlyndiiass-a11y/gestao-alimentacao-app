import { AuthGate } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeLoader } from "@/components/layout/theme-loader";
import { TopBar } from "@/components/layout/top-bar";
import { StoreProvider } from "@/contexts/store-context";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <StoreProvider>
        <ThemeLoader />
        <AppShell>
          <TopBar />
          {children}
        </AppShell>
      </StoreProvider>
    </AuthGate>
  );
}
