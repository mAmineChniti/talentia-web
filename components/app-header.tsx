'use client';

import { ChevronRight, LogOut, Sparkles } from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
    [`/${lang}/forum`]: pages.forum,
    [`/${lang}/profile`]: pages.profile,
  };

  const pageTitle = pageTitleByPath[pathname] ?? h.defaultTitle;

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
    <header className="bg-background/70 sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-transparent px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger className="-ms-1" />
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {h.home}
        </span>
        <ChevronRight className="text-muted-foreground/50 hidden size-3.5 sm:inline rtl:rotate-180" />
        <h1 className="font-heading truncate text-[15px] font-semibold tracking-tight">
          {pageTitle}
        </h1>
      </div>

      <div className="ms-auto flex items-center gap-2">
        <ModeToggle />

        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="hover:bg-accent/60 relative h-9 gap-2 rounded-full pr-2 pl-1"
              />
            }
          >
            <Avatar className="ring-primary/30 size-7 ring-1">
              <AvatarImage src={user?.profileImageUrl} alt={user?.name} />
              <AvatarFallback>
                {initials(user?.name, user?.lastname)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm font-medium lg:inline">
              {fullName(user?.name, user?.lastname)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm leading-none font-semibold">
                    {fullName(user?.name, user?.lastname)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs leading-none">
                    {user?.email}
                  </p>
                  {user?.role && (
                    <span className="bg-primary/10 text-primary inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      <Sparkles className="size-3" />
                      {user.role}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={`/${lang}/profile`} />}>
              {h.profile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
              <LogOut />
              {h.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="from-primary/30 absolute inset-x-0 bottom-0 h-px bg-linear-to-r via-transparent to-transparent" />
    </header>
  );
}
