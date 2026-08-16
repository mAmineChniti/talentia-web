'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { SessionProvider, useSession } from '@/hooks/use-session';
import { useI18n } from '@/components/i18n-provider';
import { RoleGuard } from '@/components/role-guard';
import type { SessionUser } from '@/actions/cookies';

function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const { dir } = useI18n();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider dir="ltr">
      <AppSidebar />
      <SidebarInset dir={dir}>
        <AppHeader user={user} />
        <main className="flex-1 p-4 sm:p-6">
          <RoleGuard>{children}</RoleGuard>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: SessionUser | null;
}) {
  return (
    <SessionProvider initialSession={initialSession}>
      <Shell>{children}</Shell>
    </SessionProvider>
  );
}
