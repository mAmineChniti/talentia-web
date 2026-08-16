'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { usePathname, useRouter } from 'next/navigation';

import { usersApi } from '@/lib/services/users';
import type { User } from '@/lib/types/users';
import type { SessionUser } from '@/actions/cookies';

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
  initialSession: SessionUser | null;
}) {
  const queryClient = useQueryClient();

  const userId = initialSession?.id;

  const userQuery = useQuery({
    queryKey: [...SESSION_USER_KEY, userId],
    queryFn: () => usersApi.get(userId as number),
    enabled: userId !== undefined,
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

export function useSession() {
  const ctx = React.useContext(SessionContext);
  const router = useRouter();
  const pathname = usePathname();
  React.useEffect(() => {
    if (ctx.loading || ctx.userId !== undefined) return;
    const locale = pathname.split('/').find(Boolean);
    router.replace(locale ? `/${locale}/login` : '/login');
  }, [ctx.loading, ctx.userId, pathname, router]);
  return ctx;
}
