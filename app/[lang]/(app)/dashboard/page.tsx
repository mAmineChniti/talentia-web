'use client';

import * as React from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Fingerprint,
  GraduationCap,
  HandCoins,
  MapPin,
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
import { attendanceApi } from '@/lib/services/attendance';
import { trainingsApi } from '@/lib/services/trainings';
import { interviewsApi } from '@/lib/services/interviews';
import { hasMinimumRole } from '@/lib/rbac';
import type { LeaveResponse } from '@/lib/types/leaves';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
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
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function colorFor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function timeOf(value: string) {
  const date = new Date(value);
  return date.getTime();
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

export default function DashboardPage() {
  const { dict, lang } = useI18n();
  const { userId, user } = useSession();
  const t = dict.dashboard;
  const todayLabel = formatToday(lang);

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isHr = role === 'HR';
  const canManage = hasMinimumRole(user?.role, 'HR');
  const isEmployee = !canManage && !isHr;

  // Org-wide analytics (HR and above)
  const dashboard = useApi('dashboard.get', () => dashboardApi.get(), {
    enabled: canManage,
  });
  // Payroll data (admin only)
  const payroll = useApi('payroll.list', () => payrollApi.list(), {
    enabled: isAdmin,
  });
  // Employee directory (org stats for managers, self lookup for employees)
  const employees = useApi('employees.list', () => employeesApi.list());
  // All leave requests (managers review the queue)
  const allLeaves = useApi('leaves.list', () => leavesApi.list(), {
    enabled: canManage,
  });
  // Upcoming interviews (HR and above)
  const interviews = useApi('interviews.list', () => interviewsApi.list(), {
    enabled: canManage,
  });

  const myEmployee = isEmployee
    ? employees.data?.find((e) => e.userId === userId)
    : undefined;
  const myEmployeeId = myEmployee?.id;

  // Self-service records (employee only, scoped to their own profile)
  const myLeaves = useApi(
    ['leaves', 'employee', String(myEmployeeId)],
    () => leavesApi.listByEmployee(myEmployeeId as number),
    { enabled: isEmployee && myEmployeeId !== undefined }
  );
  const myAttendance = useApi(
    ['attendance', 'employee', String(myEmployeeId)],
    () => attendanceApi.listByEmployee(myEmployeeId as number),
    { enabled: isEmployee && myEmployeeId !== undefined }
  );
  const trainings = useApi('trainings.list', () => trainingsApi.list(), {
    enabled: isEmployee,
  });
  const myEnrollments = useApi(
    ['trainings', 'employee', String(myEmployeeId)],
    () => trainingsApi.listByEmployee(myEmployeeId as number),
    { enabled: isEmployee && myEmployeeId !== undefined }
  );

  const username = [user?.name, user?.lastname].filter(Boolean).join(' ');
  const data = dashboard.data;

  const byDept = React.useMemo(() => {
    const counts: Record<string, number> = {};
    if (canManage && employees.data != undefined) {
      for (const e of employees.data) {
        if (!e.active) continue;
        const d = e.department || '—';
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, value], i) => ({
        name,
        value,
        fill: colorFor(i),
      }))
      .toSorted((a, b) => b.value - a.value);
  }, [employees.data, canManage]);

  const monthlyPayroll = React.useMemo(() => {
    if (!isAdmin) return [];
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
  }, [payroll.data, isAdmin]);

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

  const attendanceConfig = {
    present: { label: t.present, color: 'var(--chart-2)' },
    late: { label: t.late, color: 'var(--chart-3)' },
    absent: { label: t.absent, color: 'var(--chart-5)' },
  } satisfies ChartConfig;

  const orgAttendanceData = [
    {
      status: 'present',
      value: data?.presentToday ?? 0,
      fill: 'var(--color-present)',
    },
    {
      status: 'late',
      value: data?.lateToday ?? 0,
      fill: 'var(--color-late)',
    },
    {
      status: 'absent',
      value: data?.absentToday ?? 0,
      fill: 'var(--color-absent)',
    },
  ];

  const contractsConfig = {
    active: { label: t.activeContracts, color: 'var(--chart-2)' },
    expired: { label: t.expiredContracts, color: 'var(--destructive)' },
  } satisfies ChartConfig;

  const contractsData = [
    {
      status: 'active',
      value: data?.activeContracts ?? 0,
      fill: 'var(--color-active)',
    },
    {
      status: 'expired',
      value: data?.expiredContracts ?? 0,
      fill: 'var(--color-expired)',
    },
  ];
  const contractsTotal =
    (data?.activeContracts ?? 0) + (data?.expiredContracts ?? 0);

  const leavesStatusConfig = {
    count: { label: t.leavesByStatus, color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const leavesStatusData = [
    {
      name: dict.status.PENDING,
      value: data?.pendingLeaves ?? 0,
      fill: 'var(--chart-3)',
    },
    {
      name: dict.status.APPROVED,
      value: data?.approvedLeaves ?? 0,
      fill: 'var(--chart-2)',
    },
    {
      name: dict.status.REJECTED,
      value: data?.rejectedLeaves ?? 0,
      fill: 'var(--destructive)',
    },
  ];

  const deptConfig = {
    value: { label: t.byDepartment, color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const payrollConfig = {
    total: { label: t.monthlyPayroll, color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  // ===== Employee self-service derivations =====

  const myApprovedLeaves = React.useMemo(
    () => (myLeaves.data ?? []).filter((l) => l.status === 'APPROVED'),
    [myLeaves.data]
  );

  const myUsedDays = React.useMemo(() => {
    const now = new Date();
    return myApprovedLeaves
      .filter((l) => {
        const start = new Date(l.startDate);
        return start.getFullYear() === now.getFullYear();
      })
      .reduce((sum, l) => sum + l.numberOfDays, 0);
  }, [myApprovedLeaves]);

  const myPendingCount = React.useMemo(
    () => (myLeaves.data ?? []).filter((l) => l.status === 'PENDING').length,
    [myLeaves.data]
  );

  const myRecentAttendance = React.useMemo(() => {
    const now = new Date();
    return (myAttendance.data ?? []).filter(
      (r) => now.getTime() - timeOf(r.date) <= THIRTY_DAYS_MS
    );
  }, [myAttendance.data]);

  const myAttendanceRows = React.useMemo(
    () => [
      {
        status: 'present',
        value: myRecentAttendance.filter((r) => r.status === 'PRESENT').length,
        fill: 'var(--color-present)',
      },
      {
        status: 'late',
        value: myRecentAttendance.filter((r) => r.status === 'RETARD').length,
        fill: 'var(--color-late)',
      },
      {
        status: 'absent',
        value: myRecentAttendance.filter((r) => r.status === 'ABSENT').length,
        fill: 'var(--color-absent)',
      },
    ],
    [myRecentAttendance]
  );

  const myAttendanceRate =
    myRecentAttendance.length > 0
      ? Math.round(
          (myRecentAttendance.filter((r) => r.status !== 'ABSENT').length /
            myRecentAttendance.length) *
            100
        )
      : 0;

  const completedTrainings = React.useMemo(
    () =>
      (myEnrollments.data ?? []).filter((e) => e.status === 'COMPLETED').length,
    [myEnrollments.data]
  );
  const activeEnrollments = React.useMemo(
    () =>
      (myEnrollments.data ?? []).filter((e) => e.status === 'REGISTERED')
        .length,
    [myEnrollments.data]
  );

  const upcomingLeaves = React.useMemo(() => {
    const today = startOfToday();
    return myApprovedLeaves
      .filter((l) => timeOf(l.endDate) >= today)
      .toSorted((a, b) => timeOf(a.startDate) - timeOf(b.startDate))
      .slice(0, 5);
  }, [myApprovedLeaves]);

  const suggestedTrainings = React.useMemo(() => {
    if (!isEmployee) return [];
    const today = startOfToday();
    return (trainings.data ?? [])
      .filter(
        (tr) =>
          tr.status !== 'DONE' &&
          tr.status !== 'CANCELLED' &&
          timeOf(tr.endDate) >= today
      )
      .toSorted((a, b) => timeOf(a.startDate) - timeOf(b.startDate))
      .slice(0, 4);
  }, [trainings.data, isEmployee]);

  const leaveTypeRows = React.useMemo(() => {
    const totals: Record<string, number> = {};
    for (const l of myApprovedLeaves) {
      totals[l.type] = (totals[l.type] ?? 0) + l.numberOfDays;
    }
    return Object.entries(dict.leaves.types)
      .map(([type, label], i) => ({
        name: label,
        value: totals[type] ?? 0,
        fill: colorFor(i),
      }))
      .filter((row) => row.value > 0);
  }, [myApprovedLeaves, dict.leaves.types]);

  const leaveTypeConfig = {
    days: { label: t.leavesByTypeDesc, color: 'var(--chart-1)' },
  } satisfies ChartConfig;

  const plannedInterviews = React.useMemo(() => {
    if (!canManage) return [];
    const now = new Date();
    const cutoff = now.getTime() - 12 * 60 * 60 * 1000;
    return (interviews.data ?? [])
      .filter(
        (i) => i.status === 'PLANNED' && timeOf(i.interviewDate) >= cutoff
      )
      .toSorted((a, b) => timeOf(a.interviewDate) - timeOf(b.interviewDate))
      .slice(0, 5);
  }, [interviews.data, canManage]);

  // ===== Loading / error gating =====

  const primaryError = canManage ? dashboard.error : employees.error;

  if (primaryError)
    return (
      <ErrorState
        onRetry={canManage ? dashboard.refetch : employees.refetch}
        description={primaryError.message}
      />
    );
  if (
    (canManage
      ? dashboard.loading || !dashboard.data
      : employees.loading || !employees.data) ||
    (isEmployee &&
      ((myEmployeeId !== undefined &&
        (myLeaves.loading || myAttendance.loading || myEnrollments.loading)) ||
        trainings.loading))
  )
    return <DashboardSkeleton />;

  const pendingLeaves =
    allLeaves.data?.filter((l) => l.status === 'PENDING') ?? [];

  const orgAttendanceRate =
    data && data.totalEmployees > 0
      ? Math.round((data.presentToday / data.totalEmployees) * 100)
      : 0;

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
                {canManage ? t.description : t.descriptionSelf}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canManage && (
                <>
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                    <ScanLine className="size-3.5" />
                    {t.attendanceToday} · {data?.presentToday ?? 0}/
                    {data?.totalEmployees ?? 0}
                  </span>
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                    <Users className="size-3.5" />
                    {data?.activeEmployees ?? 0} {t.active}
                  </span>
                </>
              )}
              {isAdmin && (
                <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                  <HandCoins className="size-3.5" />
                  {t.monthlyPayroll} · {formatCurrency(data?.totalSalary)}
                </span>
              )}
              {isEmployee && (
                <>
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                    <CalendarDays className="size-3.5" />
                    {t.myPendingRequests} · {myPendingCount}
                  </span>
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                    <ScanLine className="size-3.5" />
                    {t.attendanceRateLabel} · {myAttendanceRate}%
                  </span>
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 backdrop-blur-sm">
                    <GraduationCap className="size-3.5" />
                    {activeEnrollments} {t.trainingsEnrolled}
                  </span>
                </>
              )}
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
              {isEmployee && (
                <Button
                  render={<Link href="/trainings" />}
                  nativeButton={false}
                  size="sm"
                  className="bg-primary-foreground/15 text-primary-foreground ring-primary-foreground/25 hover:bg-primary-foreground/25 ring-1 ring-inset"
                >
                  <GraduationCap /> {t.browseTrainings}
                </Button>
              )}
            </div>
          </div>

          <div className="lg:w-[340px]">
            {canManage ? (
              <div className="bg-primary-foreground/10 ring-primary-foreground/20 h-full rounded-2xl p-4 ring-1 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="bg-primary-foreground text-primary flex size-7 items-center justify-center rounded-lg shadow-sm">
                    <Sparkles className="size-4" />
                  </div>
                  <p className="text-sm font-semibold">{t.insights}</p>
                </div>
                <p className="text-primary-foreground/85 mt-2.5 text-[13px] leading-relaxed">
                  {data?.aiRecommendation}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1">
                    {data?.bestDepartment || t.noDataYet}
                  </span>
                  <span className="bg-primary-foreground/15 ring-primary-foreground/20 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1">
                    {data?.pendingLeaves ?? 0} {t.pendingLeaves}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-primary-foreground/10 ring-primary-foreground/20 h-full rounded-2xl p-4 ring-1 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="bg-primary-foreground text-primary flex size-7 items-center justify-center rounded-lg shadow-sm">
                    <CalendarDays className="size-4" />
                  </div>
                  <p className="text-sm font-semibold">{t.upcomingLeaves}</p>
                </div>
                {upcomingLeaves[0] ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-semibold">
                      {dict.leaves.types[upcomingLeaves[0].type] ??
                        upcomingLeaves[0].type}
                    </p>
                    <p className="text-primary-foreground/85 text-[13px]">
                      {formatDate(upcomingLeaves[0].startDate)} →{' '}
                      {formatDate(upcomingLeaves[0].endDate)}
                    </p>
                    <span className="bg-primary-foreground/15 ring-primary-foreground/20 mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1">
                      {upcomingLeaves[0].numberOfDays}{' '}
                      {upcomingLeaves[0].numberOfDays > 1 ? t.days : t.day}
                    </span>
                  </div>
                ) : (
                  <p className="text-primary-foreground/85 mt-2.5 text-[13px] leading-relaxed">
                    {t.noUpcomingLeaves}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee profile not linked yet */}
      {isEmployee && !myEmployee && (
        <Card className="border-chart-3/30 bg-chart-3/5 rounded-2xl shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <div className="bg-chart-3/15 text-chart-3 flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Users className="size-5" />
            </div>
            <div>
              <p className="font-medium">{t.noProfileLink}</p>
              <p className="text-muted-foreground text-sm">
                {t.noProfileLinkDesc}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI row */}
      {canManage ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t.employeesTotal}
            value={formatNumber(data?.totalEmployees)}
            hint={`${data?.activeEmployees ?? 0} ${t.active}`}
            icon={<Users className="size-5" />}
            accent="primary"
          />
          <StatCard
            label={t.applications}
            value={formatNumber(data?.totalApplications)}
            hint={`${data?.totalInterviews ?? 0} ${t.interviews}`}
            icon={<BriefcaseBusiness className="size-5" />}
            accent="info"
          />
          {!isAdmin && (
            <StatCard
              label={t.attendanceToday}
              value={`${orgAttendanceRate}%`}
              hint={`${data?.presentToday ?? 0}/${data?.totalEmployees ?? 0}`}
              icon={<ScanLine className="size-5" />}
              accent="success"
            />
          )}
          <StatCard
            label={t.pendingLeaves}
            value={formatNumber(data?.pendingLeaves)}
            hint={t.pendingApproval}
            icon={<CalendarDays className="size-5" />}
            accent="warning"
          />
          {isAdmin && (
            <StatCard
              label={t.monthlyPayroll}
              value={formatCurrency(data?.totalSalary)}
              hint={`${t.average} ${formatCurrency(data?.averageSalary)}`}
              trend={payrollTrend?.delta}
              trendPositive={payrollTrend?.positive}
              icon={<HandCoins className="size-5" />}
              accent="success"
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t.myLeaveDays}
            value={formatNumber(myUsedDays)}
            hint={t.myLeaveDaysHint}
            icon={<CalendarDays className="size-5" />}
            accent="primary"
          />
          <StatCard
            label={t.myPendingRequests}
            value={formatNumber(myPendingCount)}
            hint={t.myPendingHint}
            icon={<CalendarDays className="size-5" />}
            accent="warning"
          />
          <StatCard
            label={t.attendanceRateLabel}
            value={`${myAttendanceRate}%`}
            hint={t.last30Days}
            icon={<ScanLine className="size-5" />}
            accent="success"
          />
          <StatCard
            label={t.trainingsCompleted}
            value={formatNumber(completedTrainings)}
            hint={`${activeEnrollments} ${t.trainingsEnrolled}`}
            icon={<GraduationCap className="size-5" />}
            accent="info"
          />
        </div>
      )}

      {/* Charts row 1 */}
      {isAdmin && (
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
                {formatCurrency(
                  monthlyPayroll.reduce((s, m) => s + m.total, 0)
                )}
              </div>
            </CardHeader>
            <CardContent>
              {monthlyPayroll.length > 0 ? (
                <ChartContainer
                  config={payrollConfig}
                  className="aspect-[16/7] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={monthlyPayroll}
                    margin={{ top: 8, left: 8, right: 8 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={48}
                      tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Bar
                      dataKey="total"
                      fill="var(--color-total)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={42}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart message={t.noPayrollData} />
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
              <DonutChart data={orgAttendanceData} config={attendanceConfig} />
              <DonutLegend data={orgAttendanceData} config={attendanceConfig} />
            </CardContent>
          </Card>
        </div>
      )}

      {isHr && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
              <DonutChart data={orgAttendanceData} config={attendanceConfig} />
              <DonutLegend data={orgAttendanceData} config={attendanceConfig} />
            </CardContent>
          </Card>

          {/* Leaves by status */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base">
                {t.leavesByStatus}
              </CardTitle>
              <CardDescription>{t.leavesByStatusDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={leavesStatusConfig}
                className="aspect-[4/3] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={leavesStatusData}
                  margin={{ top: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={32}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {leavesStatusData.map((entry) => (
                      // eslint-disable-next-line @typescript-eslint/no-deprecated
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Contracts overview */}
          <ContractsDonutCard
            data={contractsData}
            config={contractsConfig}
            total={contractsTotal}
            title={t.contractsHealth}
            subtitle={t.contractsHealthDesc}
            badgeLabel={dict.contracts.title}
          />
        </div>
      )}

      {isEmployee && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* My attendance this month */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-base">
                {t.myAttendanceChart}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <ScanLine className="size-3.5" /> {t.last30Days}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myRecentAttendance.length > 0 ? (
                <>
                  <DonutChart
                    data={myAttendanceRows}
                    config={attendanceConfig}
                  />
                  <DonutLegend
                    data={myAttendanceRows}
                    config={attendanceConfig}
                  />
                </>
              ) : (
                <EmptyChart icon={<ScanLine />} message={t.noAttendanceYet} />
              )}
            </CardContent>
          </Card>

          {/* My leave days by type */}
          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading text-base">
                {t.leavesByType}
              </CardTitle>
              <CardDescription>{t.leavesByTypeDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {leaveTypeRows.length > 0 ? (
                <ChartContainer
                  config={leaveTypeConfig}
                  className="aspect-[16/7] w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={leaveTypeRows}
                    layout="vertical"
                    margin={{ top: 0, left: 0, right: 8, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={110}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="days"
                      fill="var(--color-days)"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyChart icon={<CalendarDays />} message={t.noLeavesYet} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts row 2 */}
      {(canManage || isEmployee) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {canManage && (
            <>
              {/* Department distribution */}
              <Card className="rounded-2xl shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-heading text-base">
                    {t.byDepartment}
                  </CardTitle>
                  <CardDescription>{t.byDepartmentDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  {byDept.length > 0 ? (
                    <ChartContainer
                      config={deptConfig}
                      className="aspect-[16/7] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={byDept}
                        layout="vertical"
                        margin={{ top: 0, left: 0, right: 8, bottom: 0 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          width={110}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--color-value)"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={18}
                        >
                          {byDept.map((entry) => (
                            // eslint-disable-next-line @typescript-eslint/no-deprecated
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <EmptyChart icon={<Users />} message={t.noEmployees} />
                  )}
                </CardContent>
              </Card>

              {/* Upcoming interviews (HR) / contracts overview (admin) */}
              {isHr ? (
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="font-heading text-base">
                        {t.upcomingInterviews}
                      </CardTitle>
                      <CardDescription>
                        {t.upcomingInterviewsDesc}
                      </CardDescription>
                    </div>
                    <Button
                      render={<Link href="/recruitment" />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                    >
                      {t.viewAll}{' '}
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {plannedInterviews.length > 0 ? (
                      <ul className="divide-y">
                        {plannedInterviews.map((i) => (
                          <li
                            key={i.id}
                            className="flex items-center gap-3 py-3"
                          >
                            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                              <CalendarDays className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {formatDateTime(i.interviewDate)}
                              </p>
                              <p className="text-muted-foreground flex min-w-0 items-center gap-1 truncate text-xs">
                                {i.location ? (
                                  <>
                                    <MapPin className="size-3 shrink-0" />{' '}
                                    {i.location}
                                  </>
                                ) : (
                                  `#${i.applicationId}`
                                )}
                              </p>
                            </div>
                            <StatusBadge status={i.type} />
                            <StatusBadge status={i.status} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyChart
                        icon={<BriefcaseBusiness />}
                        message={t.noUpcomingInterviews}
                      />
                    )}
                  </CardContent>
                </Card>
              ) : (
                <ContractsDonutCard
                  data={contractsData}
                  config={contractsConfig}
                  total={contractsTotal}
                  title={t.contractsHealth}
                  subtitle={t.contractsHealthDesc}
                  badgeLabel={dict.contracts.title}
                />
              )}
            </>
          )}

          {isEmployee && (
            <>
              {/* My upcoming leaves */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="font-heading text-base">
                      {t.upcomingLeaves}
                    </CardTitle>
                    <CardDescription>{t.leavesByTypeDesc}</CardDescription>
                  </div>
                  <Button
                    render={<Link href="/leaves" />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                  >
                    {t.viewAll}{' '}
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {upcomingLeaves.length > 0 ? (
                    <ul className="divide-y">
                      {upcomingLeaves.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 py-3">
                          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                            <CalendarDays className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {dict.leaves.types[l.type] ?? l.type}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {formatDate(l.startDate)} →{' '}
                              {formatDate(l.endDate)}
                            </p>
                          </div>
                          <span className="bg-muted text-muted-foreground hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline">
                            {l.numberOfDays}{' '}
                            {l.numberOfDays > 1 ? t.days : t.day}
                          </span>
                          <StatusBadge status={l.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyChart
                      icon={<CalendarDays />}
                      message={t.noUpcomingLeaves}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Suggested trainings */}
              <Card className="rounded-2xl shadow-sm lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="font-heading text-base">
                      {t.suggestedTrainings}
                    </CardTitle>
                    <CardDescription>
                      {t.suggestedTrainingsDesc}
                    </CardDescription>
                  </div>
                  <Button
                    render={<Link href="/trainings" />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                  >
                    {t.viewAll}{' '}
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {suggestedTrainings.length > 0 ? (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {suggestedTrainings.map((tr) => {
                        const taken = tr.numberOfParticipants ?? 0;
                        const pct = tr.capacity
                          ? Math.min(
                              100,
                              Math.round((taken / tr.capacity) * 100)
                            )
                          : 100;
                        return (
                          <li
                            key={tr.id}
                            className="bg-muted/40 rounded-2xl border p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold">
                                {tr.title}
                              </p>
                              <StatusBadge status={tr.status} />
                            </div>
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              {tr.trainer} · {formatDate(tr.startDate)} →{' '}
                              {formatDate(tr.endDate)}
                            </p>
                            <div className="bg-muted mt-3 h-1.5 w-full overflow-hidden rounded-full">
                              <div
                                className="from-primary to-brand-2 h-full rounded-full bg-linear-to-r"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-[11px] font-medium">
                              {t.seatsLeft
                                .replace('{count}', () => String(taken))
                                .replace('{capacity}', () =>
                                  String(tr.capacity)
                                )}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <EmptyChart
                      icon={<GraduationCap />}
                      message={t.noSuggestedTrainings}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Pending leave approvals (HR and above) */}
      {canManage && (
        <Card className="rounded-2xl shadow-sm">
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
      )}
    </div>
  );
}

function ContractsDonutCard({
  data,
  config,
  total,
  title,
  subtitle,
  badgeLabel,
}: {
  data: { status: string; value: number; fill: string }[];
  config: ChartConfig;
  total: number;
  title: string;
  subtitle: string;
  badgeLabel: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <>
            <div className="relative">
              <DonutChart data={data} config={config} />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-9">
                <div className="text-center">
                  <div className="font-heading text-2xl leading-none font-bold tabular-nums">
                    {total}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {badgeLabel}
                  </div>
                </div>
              </div>
            </div>
            <DonutLegend data={data} config={config} />
          </>
        ) : (
          <EmptyChart message={badgeLabel} />
        )}
      </CardContent>
    </Card>
  );
}

function DonutChart({
  data,
  config,
}: {
  data: { status: string; value: number; fill: string }[];
  config: ChartConfig;
}) {
  return (
    <ChartContainer
      config={config}
      className="aspect-square max-h-[210px] w-full"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="status"
          innerRadius={58}
          outerRadius={82}
          paddingAngle={3}
          strokeWidth={0}
        />
      </PieChart>
    </ChartContainer>
  );
}

function DonutLegend({
  data,
  config,
}: {
  data: { status: string; value: number; fill: string }[];
  config: ChartConfig;
}) {
  return (
    <div className="mt-4 space-y-2">
      {data.map((row) => (
        <div
          key={row.status}
          className="bg-muted/40 flex items-center justify-between rounded-xl px-3 py-2"
        >
          <span className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <span
              className="size-2.5 rounded-full"
              style={{ background: row.fill }}
            />
            {config[row.status]?.label ?? row.status}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({
  icon,
  message,
}: {
  icon?: React.ReactNode;
  message: string;
}) {
  return (
    <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 text-sm">
      {icon && (
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
          {icon}
        </div>
      )}
      {message}
    </div>
  );
}

function LeaveRequestRow({ leave }: { leave: LeaveResponse }) {
  const { dict } = useI18n();
  const t = dict.dashboard;
  const lt = dict.leaves;
  const { userId, user } = useSession();
  const canApprove = hasMinimumRole(user?.role, 'HR');

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
      {canApprove && (
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
