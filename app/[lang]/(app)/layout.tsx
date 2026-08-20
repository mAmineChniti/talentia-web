import { redirect } from 'next/navigation';

import { getSessionCookie } from '@/actions/cookies';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await getSessionCookie();

  if (!session) {
    redirect(`/${lang}/login`);
  }

  return <AppShell initialSession={session}>{children}</AppShell>;
}
