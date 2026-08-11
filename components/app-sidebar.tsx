'use client';

import {
  BarChart3,
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
  SidebarFooter,
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
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

export function AppSidebar() {
  const pathname = usePathname();
  const { dict, lang } = useI18n();
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
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight">
              TalentIA
            </span>
            <span className="text-muted-foreground truncate text-[11px]">
              {s.suite}
            </span>
          </div>
          <SidebarTrigger className="-mr-1 ml-auto lg:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navMain.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
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
                        asChild
                        isActive={isActive}
                        tooltip={title}
                        className={cn(
                          isActive &&
                            'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="text-muted-foreground flex items-center gap-2 px-2 py-1 text-[11px]">
          <BarChart3 className="size-3.5" />
          <span className="truncate">{s.version}</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
