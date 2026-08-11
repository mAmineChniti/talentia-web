'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { usePathname, useRouter } from 'next/navigation';

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

const SESSION_ME_KEY = ['api', 'session.me'] as const;
const SESSION_USER_KEY = ['api', 'session.user'] as const;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: [...SESSION_ME_KEY],
    queryFn: async () => {
      return (await authApi.me()) ?? '';
    },
  });

  const userId = meQuery.data === '' ? undefined : meQuery.data;

  const userQuery = useQuery({
    queryKey: [...SESSION_USER_KEY, userId],
    queryFn: () => usersApi.get(userId as number),
    enabled: userId !== undefined,
  });

  const isLoading =
    meQuery.isPending || (userId !== undefined && userQuery.isPending);

  const refresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...SESSION_ME_KEY] });
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
