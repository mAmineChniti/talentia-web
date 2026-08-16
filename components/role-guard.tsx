'use client';

import { useSession } from '@/hooks/use-session';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { canAccessRoute } from '@/lib/rbac';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!canAccessRoute(user?.role, pathname)) {
      const locale = pathname.split('/').find(Boolean);
      router.replace(`/${locale}/dashboard`);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
