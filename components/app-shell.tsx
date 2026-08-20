'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
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
        <div className="border-primary from-primary/20 to-brand-2/20 h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent bg-linear-to-br" />
      </div>
    );
  }

  return (
    <SidebarProvider dir="ltr">
      <AppSidebar />
      <SidebarInset dir={dir}>
        <div className="relative flex min-h-svh flex-1 flex-col">
          <div className="from-primary/10 via-brand-2/5 pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-linear-to-br to-transparent opacity-60" />
          <AppHeader user={user} />
          <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6 lg:p-8">
            <RoleGuard>{children}</RoleGuard>
          </main>
          <AppFooter />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppShell({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: SessionUser | undefined;
}) {
  return (
    <SessionProvider initialSession={initialSession}>
      <Shell>{children}</Shell>
    </SessionProvider>
  );
}
