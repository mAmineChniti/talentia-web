'use client';

import * as React from 'react';
import {
  AlarmClock,
  Clock,
  Fingerprint,
  LogIn,
  LogOut,
  Timer,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { attendanceApi } from '@/lib/services/attendance';
import { employeesApi } from '@/lib/services/employees';
import { usersApi } from '@/lib/services/users';
import type { User } from '@/lib/types/users';
import type { Attendance } from '@/lib/types/attendance';
import { formatDate, formatTime, fullName, initials } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { ScanDialog } from '@/components/scan-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function hoursLabel(value: number | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value} h`;
}

export default function AttendancePage() {
  const { dict } = useI18n();
  const t = dict.attendance;
  const { user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'HR');
  const [date, setDate] = React.useState(todayISO);

  const employees = useApi('employees.list', () => employeesApi.list());
  const { data: users } = useApi('users.list', () => usersApi.list());
  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users) {
      for (const u of users) m.set(u.id, u);
    }
    return m;
  }, [users]);

  const activeEmployees = React.useMemo(() => {
    return (employees.data ?? []).filter((e) => e.active);
  }, [employees.data]);

  const myEmployee = canManage
    ? undefined
    : activeEmployees.find((e) => e.userId === user?.id);

  const {
    data: records,
    loading,
    error,
    refetch,
  } = useApi(
    canManage
      ? ['attendance', 'date', date]
      : ['attendance', 'employee', String(myEmployee?.id ?? ''), date],
    () =>
      canManage
        ? attendanceApi.listByDate(date)
        : attendanceApi.listByEmployeeAndDate(myEmployee!.id, date),
    { enabled: canManage || myEmployee?.id !== undefined }
  );

  const tableRows = React.useMemo(() => {
    if (!canManage) return records ?? [];
    const recordByEmployeeId = new Map<number, Attendance>();
    const recordList = records ?? [];
    for (const r of recordList) {
      if (r.employee?.id !== undefined)
        recordByEmployeeId.set(r.employee.id, r);
    }
    return activeEmployees.map((emp) => {
      const existing = recordByEmployeeId.get(emp.id);
      if (existing) return existing;
      const empUser = userMap.get(emp.userId);
      return {
        id: -emp.id,
        date: date,
        employee: {
          id: emp.id,
          user: empUser
            ? {
                id: empUser.id,
                name: empUser.name,
                lastname: empUser.lastname,
                profileImageUrl: empUser.profileImageUrl,
              }
            : undefined,
          employeeCode: emp.employeeCode,
          position: emp.position,
        },
        status: 'ABSENT' as const,
        checkIn: undefined,
        checkOut: undefined,
        workedHours: undefined,
        delayMinutes: undefined,
      } satisfies Partial<Attendance> as Attendance;
    });
  }, [canManage, records, activeEmployees, date, userMap]);

  const employeesCount = canManage ? activeEmployees.length : 1;
  const present = (records ?? []).filter((r) => r.status === 'PRESENT').length;
  const late = (records ?? []).filter((r) => r.status === 'RETARD').length;
  const absent = canManage
    ? Math.max(employeesCount - present - late, 0)
    : (records ?? []).filter((r) => r.status === 'ABSENT').length;
  const checkedIn = present + late;
  const totalWorked = (records ?? []).reduce(
    (sum, r) => sum + (r.workedHours ?? 0),
    0
  );
  const rate =
    employeesCount > 0 ? Math.round((checkedIn / employeesCount) * 100) : 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={formatDate(date)}
        title={t.title}
        description={(canManage ? t.date : t.myDate)
          .split('{date}')
          .join(formatDate(date))}
        icon={<Fingerprint className="size-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={date}
              onChange={(value) => setDate(value || todayISO())}
              className="w-fit"
              aria-label={t.selectDate}
            />
            <ScanDialog onScanned={refetch} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t.present}
          value={present}
          hint={t.attendanceRate.split('{rate}').join(String(rate))}
          icon={<UserCheck className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.late}
          value={late}
          hint={canManage ? t.lateToday : t.lateRecorded}
          icon={<AlarmClock className="size-5" />}
          accent="warning"
        />
        <StatCard
          label={t.absent}
          value={absent}
          hint={canManage ? t.absentToday : t.absentRecorded}
          icon={<XCircle className="size-5" />}
          accent="danger"
        />
        <StatCard
          label={t.hoursWorked}
          value={hoursLabel(totalWorked)}
          hint={t.totalDay}
          icon={<Timer className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.scans}
          value={`${checkedIn}/${employeesCount || '—'}`}
          hint={canManage ? t.employeesScanned : t.myScans}
          icon={<Users className="size-5" />}
        />
      </div>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          {error ? (
            <ErrorState onRetry={refetch} description={error.message} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => {
                return <Skeleton key={i} className="h-14 w-full" />;
              })}
            </div>
          ) : tableRows.length === 0 ? (
            <EmptyState
              icon={<Fingerprint className="size-6" />}
              title={t.noScans}
              description={t.noScansDesc}
              action={<ScanDialog onScanned={refetch} />}
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t.dateColumn}</TableHead>
                    {canManage && <TableHead>{t.employee}</TableHead>}
                    <TableHead>{t.checkIn}</TableHead>
                    <TableHead>{t.checkOut}</TableHead>
                    <TableHead>{t.work}</TableHead>
                    <TableHead>{t.delay}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((record) => {
                    return (
                      <AttendanceRow
                        key={record.id}
                        record={record}
                        canManage={canManage}
                        onDeleted={refetch}
                      />
                    );
                  })}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 8 : 7}
                      className="py-2.5 text-xs"
                    >
                      <span className="text-muted-foreground">
                        {canManage
                          ? `${checkedIn} ${t.employeesScanned}`
                          : `${checkedIn} ${t.scans}`}
                        {' · '}
                        {hoursLabel(totalWorked)} {t.totalDay}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceRow({
  record,
  canManage,
  onDeleted,
}: {
  record: Attendance;
  canManage: boolean;
  onDeleted: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.attendance;
  const employee = record.employee;
  const employeeUser = employee?.user;

  const removeMutation = useApiMutation<number, string>(
    (id) => attendanceApi.remove(id),
    {
      invalidate: [['attendance', 'date'], 'dashboard.get'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.successDeleted });
        onDeleted();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  return (
    <TableRow className="group">
      <TableCell>
        <span className="text-sm">{formatDate(record.date)}</span>
      </TableCell>
      {canManage && (
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="ring-primary/10 size-9 ring-1">
              <AvatarImage src={employeeUser?.profileImageUrl} />
              <AvatarFallback>
                {initials(employeeUser?.name, employeeUser?.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {fullName(employeeUser?.name, employeeUser?.lastname)}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {employee?.position || employee?.employeeCode || '—'}
              </p>
            </div>
          </div>
        </TableCell>
      )}
      <TableCell>
        <span className="bg-muted/60 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs">
          <LogIn className="text-chart-2 size-3" />
          {formatTime(record.checkIn)}
        </span>
      </TableCell>
      <TableCell>
        {record.checkOut ? (
          <span className="bg-muted/60 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs">
            <LogOut className="text-muted-foreground size-3" />
            {formatTime(record.checkOut)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm font-semibold tabular-nums">
          {hoursLabel(record.workedHours)}
        </span>
      </TableCell>
      <TableCell>
        {record.delayMinutes ? (
          <span className="bg-chart-3/10 text-chart-3 ring-chart-3/20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset">
            <Clock className="size-3" />
            {t.delayMinutes
              .split('{minutes}')
              .join(String(record.delayMinutes))}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={record.status} />
      </TableCell>
      <TableCell>
        {canManage && record.id > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.deleteScan}
            onClick={() => removeMutation.mutate(record.id)}
            disabled={removeMutation.isPending}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
