'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
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
} from 'lucide-react';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { createScanSchema } from '@/lib/schemas/attendance';
import { attendanceApi } from '@/lib/services/attendance';
import { employeesApi } from '@/lib/services/employees';
import type { Attendance } from '@/lib/types/attendance';
import { formatDate, formatTime, fullName, initials } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';

type ScanFormValues = z.infer<ReturnType<typeof createScanSchema>>;

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

  const {
    data: records,
    loading,
    error,
    refetch,
  } = useApi(['attendance', 'date', date], () =>
    attendanceApi.listByDate(date)
  );
  const employees = useApi('employees.list', () => employeesApi.list());

  const employeesCount = employees.data?.length ?? 0;
  const present = (records ?? []).filter((r) => r.status === 'PRESENT').length;
  const late = (records ?? []).filter((r) => r.status === 'RETARD').length;
  const checkedIn = records?.length ?? 0;
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
        description={t.date.split('{date}').join(formatDate(date))}
        icon={<Fingerprint className="size-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={date}
              onChange={(value) => setDate(value || todayISO())}
              className="w-fit"
              aria-label={t.selectDate}
            />
            {canManage && <ScanDialog onScanned={refetch} />}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          hint={t.lateRecorded}
          icon={<AlarmClock className="size-5" />}
          accent="warning"
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
          hint={t.employeesScanned}
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
          ) : (records ?? []).length === 0 ? (
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
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.checkIn}</TableHead>
                    <TableHead>{t.checkOut}</TableHead>
                    <TableHead>{t.work}</TableHead>
                    <TableHead>{t.delay}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(records ?? []).map((record) => {
                    return (
                      <AttendanceRow
                        key={record.id}
                        record={record}
                        onDeleted={refetch}
                      />
                    );
                  })}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell colSpan={7} className="py-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {checkedIn} {t.employeesScanned} ·{' '}
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
  onDeleted,
}: {
  record: Attendance;
  onDeleted: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.attendance;
  const employee = record.employee;
  const employeeUser = employee?.user;
  const { user: sessionUser } = useSession();
  const canManage = hasMinimumRole(sessionUser?.role, 'HR');

  const removeMutation = useApiMutation<number, string>(
    (id) => attendanceApi.remove(id),
    {
      invalidate: [['attendance', 'date'], 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successDeleted);
        onDeleted();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <TableRow className="group">
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
        {canManage && (
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

function ScanDialog({ onScanned }: { onScanned: () => void }) {
  const { dict } = useI18n();
  const t = dict.attendance;
  const [open, setOpen] = React.useState(false);
  const form = useForm<ScanFormValues>({
    resolver: zodResolver(createScanSchema(dict.validation)),
    defaultValues: { qrCode: '' },
  });

  const scanMutation = useApiMutation<string, Attendance>(
    (qrCode) => attendanceApi.scan(qrCode),
    {
      invalidate: [['attendance', 'date'], 'dashboard.get'],
      onSuccess: (data) => {
        const employeeName = fullName(
          data.employee?.user?.name,
          data.employee?.user?.lastname
        );
        if (data.checkOut) {
          toast.success(
            t.clockOutSuccess
              .split('{name}')
              .join(employeeName)
              .split('{time}')
              .join(formatTime(data.checkOut))
          );
        } else {
          toast.success(
            t.clockInSuccess
              .split('{name}')
              .join(employeeName)
              .split('{time}')
              .join(formatTime(data.checkIn))
          );
        }
        form.reset({ qrCode: '' });
        onScanned();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) form.reset({ qrCode: '' });
      }}
    >
      <DialogTrigger render={<Button />}>
        <Fingerprint /> {t.scanQr}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.scanDialogTitle}</DialogTitle>
          <DialogDescription>{t.scanDialogDesc}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            scanMutation.mutate(values.qrCode)
          )}
          className="grid gap-4 py-1"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="qrCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="scan-code">{t.qrCode}</FieldLabel>
                  <Input
                    {...field}
                    id="scan-code"
                    placeholder={t.qrCodePlaceholder}
                    autoFocus
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={scanMutation.isPending}>
              {scanMutation.isPending ? t.recording : t.clockIn}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
