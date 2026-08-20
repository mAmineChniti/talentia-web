'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Plus,
  ThumbsUp,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { createLeaveSchema, LEAVE_TYPES } from '@/lib/schemas/leaves';
import { employeesApi } from '@/lib/services/employees';
import { leavesApi } from '@/lib/services/leaves';
import { usersApi } from '@/lib/services/users';
import type { EmployeeResponse } from '@/lib/types/employees';
import type { LeaveResponse } from '@/lib/types/leaves';
import type { User } from '@/lib/types/users';
import { formatDate, fullName } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const leaveTypeTones: Record<string, string> = {
  ANNUAL: 'bg-primary/10 text-primary ring-primary/20',
  SICK: 'bg-chart-4/10 text-chart-4 ring-chart-4/20',
  MATERNITY: 'bg-chart-5/10 text-chart-5 ring-chart-5/20',
  PATERNITY: 'bg-chart-2/10 text-chart-2 ring-chart-2/20',
  UNPAID: 'bg-muted text-muted-foreground ring-muted-foreground/20',
  EXCEPTIONAL: 'bg-chart-3/10 text-chart-3 ring-chart-3/20',
};

type LeaveFormValues = z.infer<ReturnType<typeof createLeaveSchema>>;

export default function LeavesPage() {
  const { dict } = useI18n();
  const t = dict.leaves;
  const [tab, setTab] = React.useState('all');

  const {
    data: leaves,
    loading,
    error,
    refetch,
  } = useApi('leaves.list', () => leavesApi.list());

  const pending = (leaves ?? []).filter((l) => l.status === 'PENDING').length;
  const approved = (leaves ?? []).filter((l) => l.status === 'APPROVED').length;
  const rejected = (leaves ?? []).filter((l) => l.status === 'REJECTED').length;
  const approvedDays = (leaves ?? [])
    .filter((l) => l.status === 'APPROVED')
    .reduce((sum, l) => sum + l.numberOfDays, 0);

  const filtered = React.useMemo(() => {
    if (tab === 'all') return leaves ?? [];
    return (leaves ?? []).filter((l) => l.status === tab);
  }, [leaves, tab]);

  const tabCount: Record<string, number> = {
    all: leaves?.length ?? 0,
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected,
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.all}
        title={t.title}
        description={t.description}
        icon={<CalendarDays className="size-6" />}
        actions={<RequestLeaveDialog />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.pending}
          value={pending}
          hint={t.pendingHint}
          icon={<CalendarClock className="size-5" />}
          accent="warning"
        />
        <StatCard
          label={t.approved}
          value={approved}
          hint={t.approvedHint}
          icon={<CheckCircle2 className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.rejected}
          value={rejected}
          hint={t.rejectedHint}
          icon={<XCircle className="size-5" />}
          accent="danger"
        />
        <StatCard
          label={t.approvedDays}
          value={`${approvedDays} ${approvedDays > 1 ? t.days : t.day}`}
          hint={t.approvedDaysHint}
          icon={<Check className="size-5" />}
          accent="info"
        />
      </div>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">
                {t.all}
                <span className="bg-muted text-muted-foreground ms-1.5 rounded-full px-1.5 text-[10px] font-semibold">
                  {tabCount.all}
                </span>
              </TabsTrigger>
              <TabsTrigger value="PENDING">
                {t.pending}
                <span className="bg-chart-3/15 text-chart-3 ms-1.5 rounded-full px-1.5 text-[10px] font-semibold">
                  {tabCount.PENDING}
                </span>
              </TabsTrigger>
              <TabsTrigger value="APPROVED">
                {t.approved}
                <span className="bg-chart-2/15 text-chart-2 ms-1.5 rounded-full px-1.5 text-[10px] font-semibold">
                  {tabCount.APPROVED}
                </span>
              </TabsTrigger>
              <TabsTrigger value="REJECTED">
                {t.rejected}
                <span className="bg-destructive/15 text-destructive ms-1.5 rounded-full px-1.5 text-[10px] font-semibold">
                  {tabCount.REJECTED}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {error ? (
            <ErrorState onRetry={refetch} description={error.message} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => {
                return <Skeleton key={i} className="h-14 w-full" />;
              })}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="size-6" />}
              title={
                tab === 'all'
                  ? t.noLeaves
                  : t.noLeavesFiltered
                      .split('{status}')
                      .join(
                        (tab === 'PENDING'
                          ? t.pending
                          : tab === 'APPROVED'
                            ? t.approved
                            : t.rejected
                        ).toLowerCase()
                      )
              }
              description={t.noLeavesDesc}
              action={<RequestLeaveDialog />}
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.type}</TableHead>
                    <TableHead>{t.from}</TableHead>
                    <TableHead>{t.to}</TableHead>
                    <TableHead>{t.daysLabel}</TableHead>
                    <TableHead>{t.reason}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="w-24 text-end">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((leave) => {
                    return <LeaveRow key={leave.id} leave={leave} />;
                  })}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell colSpan={8} className="py-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {filtered.length} {t.all}
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

function LeaveRow({ leave }: { leave: LeaveResponse }) {
  const { dict } = useI18n();
  const t = dict.leaves;
  const { userId, user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'HR');

  const approveMutation = useApiMutation<
    { id: number; userId: number },
    LeaveResponse
  >(({ id, userId }) => leavesApi.approve(id, userId), {
    invalidate: ['leaves.list', 'dashboard.get'],
    onSuccess: () => toast.success(t.successApproved),
    onError: (err) => toast.error(err.message),
  });
  const rejectMutation = useApiMutation<
    { id: number; userId: number },
    LeaveResponse
  >(({ id, userId }) => leavesApi.reject(id, userId), {
    invalidate: ['leaves.list', 'dashboard.get'],
    onSuccess: () => toast.success(t.successRejected),
    onError: (err) => toast.error(err.message),
  });

  function review(action: 'approve' | 'reject', id: number) {
    if (!userId) {
      toast.error(t.loginRequired);
      return;
    }
    const vars = { id, userId };
    if (action === 'approve') approveMutation.mutate(vars);
    else rejectMutation.mutate(vars);
  }

  const isPending = leave.status === 'PENDING';

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="ring-primary/10 size-9 ring-1">
            <AvatarFallback>
              {leave.employeeName?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">
            {leave.employeeName}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
            leaveTypeTones[leave.type] ??
              'bg-muted text-muted-foreground ring-muted-foreground/20'
          )}
        >
          {dict.leaves.types[leave.type] ?? leave.type}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDate(leave.startDate)}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
        {formatDate(leave.endDate)}
      </TableCell>
      <TableCell>
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
          {leave.numberOfDays} {leave.numberOfDays > 1 ? t.days : t.day}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
        {leave.reason || '—'}
      </TableCell>
      <TableCell>
        <StatusBadge status={leave.status} />
      </TableCell>
      <TableCell>
        {canManage ? (
          <div className="flex items-center justify-end gap-1">
            {isPending ? (
              <>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="border-chart-2/30 text-chart-2 hover:text-chart-2 hover:bg-chart-2/10"
                  aria-label={t.approve}
                  title={t.approve}
                  onClick={() => review('approve', leave.id)}
                  disabled={approveMutation.isPending}
                >
                  <ThumbsUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label={t.reject}
                  title={t.reject}
                  onClick={() => review('reject', leave.id)}
                  disabled={rejectMutation.isPending}
                >
                  <X />
                </Button>
              </>
            ) : (
              <span className="text-muted-foreground/50 text-xs">—</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/50 text-xs">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function RequestLeaveDialog() {
  const { dict } = useI18n();
  const t = dict.leaves;
  const [open, setOpen] = React.useState(false);
  const employees = useApi('employees.list', () => employeesApi.list());
  const users = useApi('users.list', () => usersApi.list());

  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users.data != undefined) {
      for (const u of users.data) m.set(u.id, u);
    }
    return m;
  }, [users.data]);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(createLeaveSchema(dict.validation)),
    defaultValues: {
      employeeId: 0,
      type: 'ANNUAL',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const requestMutation = useApiMutation<LeaveFormValues, LeaveResponse>(
    (body) => leavesApi.request(body),
    {
      invalidate: ['leaves.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successSent);
        setOpen(false);
        form.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> {t.newRequest}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.requestDialogTitle}</DialogTitle>
          <DialogDescription>{t.requestDialogDesc}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            requestMutation.mutate(values)
          )}
          className="grid gap-4 py-1"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="employeeId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="leave-employee">{t.employee}</FieldLabel>
                  <Select
                    name={field.name}
                    value={String(field.value || '')}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger
                      id="leave-employee"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder={t.selectEmployee} />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions(employees.data ?? [], userMap).map(
                        (o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="leave-type">{t.leaveType}</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="leave-type"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {dict.leaves.types[type] ?? type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="leave-start">{t.start}</FieldLabel>
                    <DatePicker
                      id="leave-start"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="leave-end">{t.end}</FieldLabel>
                    <DatePicker
                      id="leave-end"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="reason"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="leave-reason">
                    {t.reasonLabel}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="leave-reason"
                    placeholder={t.reasonPlaceholder}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={requestMutation.isPending}>
              {requestMutation.isPending ? t.sending : t.sendRequest}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function employeeOptions(
  employees: EmployeeResponse[],
  userMap: Map<number, User>
) {
  return employees
    .filter((e) => userMap.has(e.userId))
    .map((e) => {
      const user = userMap.get(e.userId);
      return {
        id: e.id,
        name: fullName(user?.name, user?.lastname),
      };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
