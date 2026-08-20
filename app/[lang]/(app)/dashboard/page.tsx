'use client';

import * as React from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Fingerprint,
  HandCoins,
  ScanLine,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import Link from 'next/link';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { dashboardApi } from '@/lib/services/dashboard';
import { employeesApi } from '@/lib/services/employees';
import { leavesApi } from '@/lib/services/leaves';
import { payrollApi } from '@/lib/services/payroll';
import { hasMinimumRole } from '@/lib/rbac';
import type { LeaveResponse } from '@/lib/types/leaves';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatToday,
  monthName,
} from '@/lib/format';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { ErrorState } from '@/components/states';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { dict, lang } = useI18n();
  const { user } = useSession();
  const t = dict.dashboard;
  const todayLabel = formatToday(lang);
  const { data, loading, error, refetch } = useApi('dashboard.get', () =>
    dashboardApi.get()
  );
  const employees = useApi('employees.list', () => employeesApi.list());
  const leaves = useApi('leaves.list', () => leavesApi.list());
  const payroll = useApi('payroll.list', () => payrollApi.list());

  const username = [user?.name, user?.lastname].filter(Boolean).join(' ');
  const canManage = hasMinimumRole(user?.role, 'HR');

  const byDept = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (employees.data != undefined) {
      for (const e of employees.data) {
        const d = e.department || 'Unknown';
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .toSorted((a, b) => b.value - a.value);
  }, [employees.data]);

  const deptColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];

  const monthlyPayroll = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (payroll.data != undefined) {
      for (const p of payroll.data) {
        const key = `${p.year}-${p.month}`;
        map[key] = (map[key] ?? 0) + (p.netSalary ?? 0);
      }
    }
    return Object.entries(map)
      .toSorted((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, total]) => {
        const [year, month] = key.split('-').map(Number);
        return { month: `${monthName(month)} ${year}`, total };
      });
  }, [payroll.data]);

  const payrollTrend = React.useMemo(() => {
    if (monthlyPayroll.length < 2) return;
    const [last, prev] = [
      monthlyPayroll.at(-1)?.total ?? 0,
      monthlyPayroll.at(-2)?.total ?? 0,
    ];
    if (!prev) return;
    const delta = Math.round(((last - prev) / prev) * 100);
    return { delta: `${Math.abs(delta)}%`, positive: delta >= 0 };
  }, [monthlyPayroll]);

  const payrollConfig = {
    total: { label: t.monthlyPayroll, color: 'var(--color-chart-1)' },
  } satisfies ChartConfig;

  const attendanceColors = [
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-5)',
  ];

  const attendanceData = React.useMemo(() => {
    const d = data;
    const rows = [
      { name: t.present, value: d?.presentToday ?? 0 },
      { name: t.late, value: d?.lateToday ?? 0 },
      { name: t.absent, value: d?.absentToday ?? 0 },
    ];
    return rows;
  }, [data, t.present, t.late, t.absent]);

  if (error)
    return <ErrorState onRetry={refetch} description={error.message} />;
  if (loading || !data) return <DashboardSkeleton />;

  const pendingLeaves =
    leaves.data?.filter((l) => l.status === 'PENDING') ?? [];

  return (
    <div className="grid gap-6">
      {/* Hero banner */}
      <div className="from-primary via-primary to-brand-2 text-primary-foreground shadow-primary/25 relative overflow-hidden rounded-3xl bg-linear-to-br shadow-xl">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="bg-primary-foreground/10 absolute -end-24 -top-24 size-72 rounded-full blur-3xl" />
        <div className="bg-primary-foreground/10 absolute start-1/4 -bottom-32 size-72 rounded-full blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-5">
            <p className="text-primary-foreground/70 text-xs font-semibold tracking-widest uppercase">
              {todayLabel}
            </p>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {t.greeting}
                {username ? `, ${username}` : ''}
              </h1>
              <p className="text-primary-foreground/75 mt-1.5 max-w-xl text-sm text-pretty">
                {t.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                <ScanLine className="size-3.5" />
                {t.attendanceToday} · {data.presentToday}/{data.totalEmployees}
              </span>
              <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                <HandCoins className="size-3.5" />
                {t.monthlyPayroll} · {formatCurrency(data.totalSalary)}
              </span>
              <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                <Users className="size-3.5" />
                {data.activeEmployees} {t.active}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                render={<Link href="/leaves" />}
                nativeButton={false}
                size="sm"
                variant="secondary"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
              >
                <CalendarPlus /> {dict.leaves.newRequest}
              </Button>
              {canManage && (
                <Button
                  render={<Link href="/attendance" />}
                  nativeButton={false}
                  size="sm"
                  className="bg-primary-foreground/15 text-primary-foreground ring-primary-foreground/25 hover:bg-primary-foreground/25 ring-1 ring-inset"
                >
                  <Fingerprint /> {dict.attendance.scanQr}
                </Button>
              )}
              {canManage && (
                <Button
                  render={<Link href="/employees" />}
                  nativeButton={false}
                  size="sm"
                  className="bg-primary-foreground/15 text-primary-foreground ring-primary-foreground/25 hover:bg-primary-foreground/25 ring-1 ring-inset"
                >
                  <UserPlus /> {dict.employees.addEmployee}
                </Button>
              )}
            </div>
          </div>

          <div className="lg:w-[340px]">
            <div className="bg-primary-foreground/10 ring-primary-foreground/20 h-full rounded-2xl p-4 ring-1 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="bg-primary-foreground text-primary flex size-7 items-center justify-center rounded-lg shadow-sm">
                  <Sparkles className="size-4" />
                </div>
                <p className="text-sm font-semibold">{t.insights}</p>
              </div>
              <p className="text-primary-foreground/85 mt-2.5 text-[13px] leading-relaxed">
                {data.aiRecommendation}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="bg-primary-foreground/15 ring-primary-foreground/20 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1">
                  {data.bestDepartment || t.noDataYet}
                </span>
                <span className="bg-primary-foreground/15 ring-primary-foreground/20 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1">
                  {data.pendingLeaves} {t.pendingLeaves}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.employeesTotal}
          value={formatNumber(data.totalEmployees)}
          hint={`${data.activeEmployees} ${t.active}`}
          icon={<Users className="size-5" />}
          accent="primary"
        />
        <StatCard
          label={t.applications}
          value={formatNumber(data.totalApplications)}
          hint={`${data.totalInterviews} ${t.interviews}`}
          icon={<BriefcaseBusiness className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.pendingLeaves}
          value={formatNumber(data.pendingLeaves)}
          hint={t.pendingApproval}
          icon={<CalendarDays className="size-5" />}
          accent="warning"
        />
        <StatCard
          label={t.monthlyPayroll}
          value={formatCurrency(data.totalSalary)}
          hint={`${t.average} ${formatCurrency(data.averageSalary)}`}
          trend={payrollTrend?.delta}
          trendPositive={payrollTrend?.positive}
          icon={<HandCoins className="size-5" />}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Payroll trend */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="font-heading text-base">
                {t.payrollTrend}
              </CardTitle>
              <CardDescription>{t.payrollTrendDesc}</CardDescription>
            </div>
            <div className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
              <HandCoins className="size-3.5" />
              {formatCurrency(monthlyPayroll.reduce((s, m) => s + m.total, 0))}
            </div>
          </CardHeader>
          <CardContent>
            {monthlyPayroll.length > 0 ? (
              <ChartContainer
                config={payrollConfig}
                className="aspect-[16/7] w-full"
              >
                <BarChart
                  data={monthlyPayroll}
                  margin={{ top: 8, left: 8, right: 8 }}
                >
                  <defs>
                    <linearGradient
                      id="payrollGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-brand-2)"
                        stopOpacity={0.55}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    width={48}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#payrollGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
                {t.noPayrollData}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance today */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              {t.attendanceToday}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <ScanLine className="size-3.5" /> {t.qrScans}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="aspect-square w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {attendanceData.map((entry, i) => {
                    return (
                      // eslint-disable-next-line @typescript-eslint/no-deprecated
                      <Cell
                        key={entry.name}
                        fill={attendanceColors[i % attendanceColors.length]}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {attendanceData.map((a, i) => (
                <div
                  key={a.name}
                  className="bg-muted/40 flex items-center justify-between rounded-xl px-3 py-2"
                >
                  <span className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: attendanceColors[i] }}
                    />
                    {a.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {a.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Department distribution */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base">
              {t.byDepartment}
            </CardTitle>
            <CardDescription>{t.byDepartmentDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {byDept.length > 0 ? (
              <ChartContainer config={{}} className="aspect-[16/9] w-full">
                <BarChart
                  data={byDept}
                  layout="vertical"
                  margin={{ top: 0, left: 0, right: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    width={96}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={16}>
                    {byDept.map((entry, i) => {
                      return (
                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                        <Cell
                          key={entry.name}
                          fill={deptColors[i % deptColors.length]}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
                {t.noEmployees}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent leave requests */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-heading text-base">
                {t.recentLeaveRequests}
              </CardTitle>
              <CardDescription>{t.recentLeaveRequestsDesc}</CardDescription>
            </div>
            <Button
              render={<Link href="/leaves" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              {t.viewAll} <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length > 0 ? (
              <ul className="divide-y">
                {pendingLeaves.slice(0, 5).map((l) => (
                  <LeaveRequestRow key={l.id} leave={l} />
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 text-sm">
                <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
                  <CalendarDays className="size-5" />
                </div>
                {t.noPendingLeaves}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeaveRequestRow({ leave }: { leave: LeaveResponse }) {
  const { dict } = useI18n();
  const t = dict.dashboard;
  const lt = dict.leaves;
  const { userId, user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'HR');

  const approveMutation = useApiMutation<
    { id: number; userId: number },
    LeaveResponse
  >(({ id, userId }) => leavesApi.approve(id, userId), {
    invalidate: ['leaves.list', 'dashboard.get'],
    onSuccess: () => toast.success(lt.successApproved),
    onError: (err) => toast.error(err.message),
  });
  const rejectMutation = useApiMutation<
    { id: number; userId: number },
    LeaveResponse
  >(({ id, userId }) => leavesApi.reject(id, userId), {
    invalidate: ['leaves.list', 'dashboard.get'],
    onSuccess: () => toast.success(lt.successRejected),
    onError: (err) => toast.error(err.message),
  });

  return (
    <li className="group flex items-center gap-3 py-3">
      <Avatar className="ring-primary/15 size-9 ring-1">
        <AvatarFallback>
          {leave.employeeName?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{leave.employeeName}</p>
        <p className="text-muted-foreground truncate text-xs">
          {dict.leaves.types[leave.type] ?? leave.type} ·{' '}
          {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
        </p>
      </div>
      <span className="bg-muted text-muted-foreground hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline">
        {leave.numberOfDays} {leave.numberOfDays > 1 ? t.days : t.day}
      </span>
      <StatusBadge status={leave.status} />
      {canManage && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-chart-2 hover:text-chart-2 hover:bg-chart-2/10"
            aria-label={lt.approve}
            onClick={() =>
              userId && approveMutation.mutate({ id: leave.id, userId })
            }
            disabled={!userId || approveMutation.isPending}
          >
            <ThumbsUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label={lt.reject}
            onClick={() =>
              userId && rejectMutation.mutate({ id: leave.id, userId })
            }
            disabled={!userId || rejectMutation.isPending}
          >
            <ThumbsDown />
          </Button>
        </div>
      )}
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => {
          return <Skeleton key={i} className="h-32 rounded-2xl" />;
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
