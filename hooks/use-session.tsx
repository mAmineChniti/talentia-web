'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { usePathname, useRouter } from 'next/navigation';

import { deleteSessionCookie, type SessionUser } from '@/actions/cookies';
import { authApi } from '@/lib/services/auth';
import { usersApi } from '@/lib/services/users';
import type { User } from '@/lib/types/users';

interface Session {
  userId: number | undefined;
  user: User | undefined;
  loading: boolean;
  refresh: () => void;
}

const SessionContext = React.createContext<Session>({
  userId: undefined,
  user: undefined,
  loading: true,
  refresh: () => {},
});

const SESSION_USER_KEY = ['api', 'session.user'] as const;

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: SessionUser | undefined;
}) {
  const queryClient = useQueryClient();

  const userId = initialSession?.id;

  const userQuery = useQuery({
    queryKey: [...SESSION_USER_KEY, userId],
    queryFn: () => usersApi.get(userId as number),
    enabled: userId !== undefined,
    // The cookie seed carries no lastname — always revalidate the full record
    staleTime: 0,
    initialData: initialSession
      ? {
          id: initialSession.id,
          name: initialSession.name,
          email: initialSession.email,
          role: initialSession.role,
          lastname: '',
        }
      : undefined,
  });

  const router = useRouter();
  const pathname = usePathname();
  const kickedRef = React.useRef(false);

  // A banned user is signed out immediately, wherever they are: their
  // account no longer exists as far as the app is concerned.
  React.useEffect(() => {
    if (kickedRef.current || userQuery.data?.banned !== true) return;
    kickedRef.current = true;
    void (async () => {
      try {
        await authApi.logout();
      } catch {
        // backend unreachable or session already gone: continue cleanup
      }
      await deleteSessionCookie();
      await queryClient.invalidateQueries({ queryKey: [...SESSION_USER_KEY] });
      const locale = pathname.split('/').find(Boolean);
      router.replace(locale ? `/${locale}/login` : '/login');
    })();
  }, [userQuery.data?.banned, pathname, queryClient, router]);

  const isLoading = userId !== undefined && userQuery.isPending;

  const refresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...SESSION_USER_KEY] });
  }, [queryClient]);

  const value = React.useMemo(
    () => ({ userId, user: userQuery.data, loading: isLoading, refresh }),
    [userId, userQuery.data, isLoading, refresh]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(options?: { redirectToLoginOnMissing?: boolean }) {
  const ctx = React.useContext(SessionContext);
  const router = useRouter();
  const pathname = usePathname();
  const shouldRedirectToLogin = options?.redirectToLoginOnMissing ?? true;
  React.useEffect(() => {
    if (!shouldRedirectToLogin || ctx.loading || ctx.userId !== undefined)
      return;
    const locale = pathname.split('/').find(Boolean);
    router.replace(locale ? `/${locale}/login` : '/login');
  }, [ctx.loading, ctx.userId, pathname, shouldRedirectToLogin, router]);
  return ctx;
}
