'use client';

import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  HandCoins,
  LayoutDashboard,
  ScanLine,
  Sparkles,
  Users,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { canAccessRoute } from '@/lib/rbac';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { dict, lang } = useI18n();
  const { user } = useSession();
  const s = dict.sidebar;

  const navMain: {
    label: string;
    items: { title: string; url: string; icon: LucideIcon }[];
  }[] = [
    {
      label: s.overview,
      items: [
        {
          title: s.dashboard,
          url: `/${lang}/dashboard`,
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: s.personnel,
      items: [
        { title: s.employees, url: `/${lang}/employees`, icon: Users },
        { title: s.attendance, url: `/${lang}/attendance`, icon: ScanLine },
        { title: s.leaves, url: `/${lang}/leaves`, icon: CalendarDays },
      ],
    },
    {
      label: s.compensation,
      items: [
        { title: s.contracts, url: `/${lang}/contracts`, icon: FileText },
        { title: s.payroll, url: `/${lang}/payroll`, icon: HandCoins },
        { title: s.payslips, url: `/${lang}/payslips`, icon: FileText },
      ],
    },
    {
      label: s.development,
      items: [
        {
          title: s.trainings,
          url: `/${lang}/trainings`,
          icon: GraduationCap,
        },
        {
          title: s.recruitment,
          url: `/${lang}/recruitment`,
          icon: BriefcaseBusiness,
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="from-primary to-brand-2 shadow-primary/30 relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-lg">
            <div className="bg-primary-foreground/30 absolute -top-2 -right-2 size-6 rounded-full blur-md" />
            <Sparkles className="text-primary-foreground size-4.5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="font-heading truncate text-[15px] font-semibold tracking-tight">
              TalentIA
            </span>
            <span className="text-muted-foreground truncate text-[11px]">
              {s.suite}
            </span>
          </div>
          <SidebarTrigger className="ms-auto -me-1 lg:hidden" />
        </div>
        <div className="from-primary/40 mx-2 h-px bg-linear-to-r to-transparent" />
      </SidebarHeader>
      <SidebarContent>
        {navMain
          .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
              canAccessRoute(user?.role, item.url)
            ),
          }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="px-3 text-[10.5px] font-semibold tracking-widest uppercase opacity-70">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const title = item.title;
                    const isActive =
                      pathname === item.url ||
                      pathname?.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          render={<Link href={item.url} />}
                          isActive={isActive}
                          tooltip={title}
                          data-active={isActive || undefined}
                          className={cn(
                            'group/menu-button rounded-lg px-2.5 transition-colors',
                            'data-active:from-primary/12 data-active:to-brand-2/8 data-active:text-primary data-active:bg-linear-to-r data-active:shadow-sm',
                            'data-active:font-semibold',
                            !isActive &&
                              'transition-transform hover:translate-x-0.5'
                          )}
                        >
                          <item.icon
                            className={cn(isActive && 'text-primary')}
                            data-sidebar-icon
                          />
                          <span>{title}</span>
                          {isActive && (
                            <span className="from-primary to-brand-2 ms-auto h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
