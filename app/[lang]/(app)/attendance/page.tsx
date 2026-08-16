'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  CalendarDays,
  Clock,
  Fingerprint,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
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
        title={t.title}
        description={t.date.split('{date}').join(formatDate(date))}
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
          icon={<Clock className="size-5" />}
          accent="warning"
        />
        <StatCard
          label={t.hoursWorked}
          value={hoursLabel(totalWorked)}
          hint={t.totalDay}
          icon={<CalendarDays className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.scans}
          value={`${checkedIn}/${employeesCount || '—'}`}
          hint={t.employeesScanned}
          icon={<Users className="size-5" />}
        />
      </div>

      <Card className="rounded-lg py-0">
        <CardContent className="py-4">
          {error ? (
            <ErrorState onRetry={refetch} description={error.message} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => {
                return <Skeleton key={i} className="h-12 w-full" />;
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
  const user = employee?.user;

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
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback>
              {initials(user?.name, user?.lastname)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {fullName(user?.name, user?.lastname)}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {employee?.position || employee?.employeeCode || '—'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">
        {formatTime(record.checkIn)}
      </TableCell>
      <TableCell className="font-mono text-sm">
        {formatTime(record.checkOut)}
      </TableCell>
      <TableCell>{hoursLabel(record.workedHours)}</TableCell>
      <TableCell>
        {record.delayMinutes
          ? t.delayMinutes.split('{minutes}').join(String(record.delayMinutes))
          : '—'}
      </TableCell>
      <TableCell>
        <StatusBadge status={record.status} />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.deleteScan}
          onClick={() => removeMutation.mutate(record.id)}
          disabled={removeMutation.isPending}
        >
          <Trash2 className="text-destructive" />
        </Button>
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
      <DialogTrigger asChild>
        <Button>
          <Fingerprint /> {t.scanQr}
        </Button>
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
