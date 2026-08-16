import { getSessionCookie } from '@/actions/cookies';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionCookie();

  return <AppShell initialSession={session}>{children}</AppShell>;
}
