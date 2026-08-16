'use client';

import { LogOut } from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useApiMutation } from '@/hooks/use-api';
import { authApi } from '@/lib/services/auth';
import { fullName, initials } from '@/lib/format';
import { useI18n } from '@/components/i18n-provider';
import { toast } from 'sonner';
import { deleteSessionCookie } from '@/actions/cookies';

export function AppHeader({
  user,
}: {
  user:
    | {
        id: number;
        name?: string;
        lastname?: string;
        email?: string;
        role?: string;
        profileImageUrl?: string;
      }
    | null
    | undefined;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { dict, lang } = useI18n();
  const h = dict.header;
  const pages = dict.header.pages;

  const pageTitleByPath: Record<string, string> = {
    [`/${lang}/dashboard`]: pages.dashboard,
    [`/${lang}/employees`]: pages.employees,
    [`/${lang}/attendance`]: pages.attendance,
    [`/${lang}/leaves`]: pages.leaves,
    [`/${lang}/contracts`]: pages.contracts,
    [`/${lang}/payroll`]: pages.payroll,
    [`/${lang}/payslips`]: pages.payslips,
    [`/${lang}/trainings`]: pages.trainings,
    [`/${lang}/recruitment`]: pages.recruitment,
    [`/${lang}/profile`]: pages.profile,
  };

  const logoutMutation = useApiMutation<void, string>(() => authApi.logout(), {
    invalidate: [['session.me'], ['session.user']],
    onSuccess: () => {
      void (async () => {
        await deleteSessionCookie();
        toast.success(h.logoutSuccess);
        router.push(`/${lang}/login`);
      })();
    },
    onError: () => {
      void (async () => {
        await deleteSessionCookie();
        toast.success(h.logoutSuccess);
        router.push(`/${lang}/login`);
      })();
    },
  });

  return (
    <header className="bg-background/80 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {h.home}
        </span>
        <span className="text-muted-foreground hidden text-sm sm:inline">
          /
        </span>
        <h1 className="truncate text-sm font-semibold">
          {pageTitleByPath[pathname] ?? h.defaultTitle}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />

        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 gap-2 rounded-full pr-2 pl-1"
            >
              <Avatar className="size-7">
                <AvatarImage src={user?.profileImageUrl} alt={user?.name} />
                <AvatarFallback>
                  {initials(user?.name, user?.lastname)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm font-medium lg:inline">
                {fullName(user?.name, user?.lastname)}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">
                  {fullName(user?.name, user?.lastname)}
                </p>
                <p className="text-muted-foreground text-xs leading-none">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${lang}/profile`}>{h.profile}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
              <LogOut />
              {h.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
