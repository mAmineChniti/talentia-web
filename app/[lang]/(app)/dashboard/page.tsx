'use client';

import * as React from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  HandCoins,
  ScanLine,
  Sparkles,
  Users,
} from 'lucide-react';

import { useApi } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import Link from 'next/link';
import { dashboardApi } from '@/lib/services/dashboard';
import { employeesApi } from '@/lib/services/employees';
import { leavesApi } from '@/lib/services/leaves';
import { payrollApi } from '@/lib/services/payroll';
import { formatCurrency, formatNumber, monthName } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
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
  const { dict } = useI18n();
  const t = dict.dashboard;
  const { data, loading, error, refetch } = useApi('dashboard.get', () =>
    dashboardApi.get()
  );
  const employees = useApi('employees.list', () => employeesApi.list());
  const leaves = useApi('leaves.list', () => leavesApi.list());
  const payroll = useApi('payroll.list', () => payrollApi.list());

  const byDept = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (employees.data != undefined) {
      for (const e of employees.data) {
        const d = e.department || 'Unknown';
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => {
      return {
        name,
        value,
        fill: `var(--color-${name.toLowerCase().replaceAll(/\s+/g, '-')})`,
      };
    });
  }, [employees.data]);

  const chartConfig = React.useMemo<ChartConfig>(() => {
    const config: ChartConfig = {};
    for (const item of byDept) {
      config[item.name] = { label: item.name };
    }
    config.value = { label: t.employeesTotal };
    return config;
  }, [byDept, t.employeesTotal]);

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

  const payrollConfig = {
    total: { label: t.monthlyPayroll, color: 'var(--color-chart-1)' },
  } satisfies ChartConfig;

  const attendanceColors = [
    'var(--color-chart-1)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];

  const attendanceData = React.useMemo(() => {
    const d = data;
    return [
      { name: t.present, value: d?.presentToday ?? 0 },
      { name: t.late, value: d?.lateToday ?? 0 },
      { name: t.absent, value: d?.absentToday ?? 0 },
    ];
  }, [data, t.present, t.late, t.absent]);

  if (error)
    return <ErrorState onRetry={refetch} description={error.message} />;
  if (loading || !data) return <DashboardSkeleton />;

  const pendingLeaves =
    leaves.data?.filter((l) => l.status === 'PENDING') ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.greeting}
        description={t.description}
        actions={
          <Button variant="outline" size="sm" onClick={refetch}>
            {t.refresh}
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          icon={<HandCoins className="size-5" />}
          accent="success"
        />
      </div>

      {/* AI recommendation banner */}
      <div className="bg-muted/50 flex items-start gap-4 rounded-2xl border p-5">
        <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t.aiTips}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {data.aiRecommendation}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status="ACTIVE" />
            {data.bestDepartment ? (
              <span className="text-muted-foreground text-xs">
                {t.bestDepartment}:{' '}
                <span className="text-foreground font-medium">
                  {data.bestDepartment}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {t.noDataYet}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Payroll trend */}
        <Card className="rounded-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>{t.payrollTrend}</CardTitle>
            <CardDescription>{t.payrollTrendDesc}</CardDescription>
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
                    fill="var(--color-chart-1)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
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
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{t.attendanceToday}</CardTitle>
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
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
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
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {attendanceData.map((a, i) => (
                <div key={a.name} className="bg-muted/50 rounded-lg px-2 py-2">
                  <p className="text-sm font-semibold">{a.value}</p>
                  <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-[11px]">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: attendanceColors[i] }}
                    />
                    {a.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Department distribution */}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{t.byDepartment}</CardTitle>
            <CardDescription>{t.byDepartmentDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {byDept.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-[16/9] w-full"
              >
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
                    width={90}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.3 }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {byDept.map((entry) => {
                      return (
                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                        <Cell
                          key={entry.name}
                          fill={`var(--color-chart-${(byDept.indexOf(entry) % 5) + 1})`}
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

        {/* Pending leaves */}
        <Card className="rounded-lg lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>{t.recentLeaveRequests}</CardTitle>
              <CardDescription>{t.recentLeaveRequestsDesc}</CardDescription>
            </div>
            <Button
              render={<Link href="/leaves" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              {t.viewAll}
            </Button>
          </CardHeader>
          <CardContent>
            {pendingLeaves.length > 0 ? (
              <ul className="space-y-3">
                {pendingLeaves.slice(0, 5).map((l) => (
                  <li key={l.id} className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback>
                        {l.employeeName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {l.employeeName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {l.type} · {formatNumber(l.numberOfDays)}{' '}
                        {l.numberOfDays > 1 ? t.days : t.day}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 text-sm">
                <CalendarDays className="size-6" />
                {t.noPendingLeaves}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => {
          return <Skeleton key={i} className="h-28 rounded-2xl" />;
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
