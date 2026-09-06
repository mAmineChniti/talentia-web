import { getSessionCookie } from '@/actions/cookies';
import { AppShell } from '@/components/app-shell';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionCookie();

  if (session) {
    return <AppShell initialSession={session}>{children}</AppShell>;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
