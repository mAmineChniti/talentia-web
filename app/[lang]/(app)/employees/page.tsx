'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { createEmployeeSchema } from '@/lib/schemas/employees';
import { employeesApi } from '@/lib/services/employees';
import { usersApi } from '@/lib/services/users';
import type { EmployeeResponse } from '@/lib/types/employees';
import type { User } from '@/lib/types/users';
import { formatCurrency, formatDate, fullName, initials } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { UserCombobox } from '@/components/employee-combobox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { StatusBadge } from '@/components/status-badge';
import { DatePicker } from '@/components/ui/date-picker';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Internship'];

const departmentTones: Record<string, string> = {
  Engineering: 'bg-primary/10 text-primary ring-primary/20',
  RH: 'bg-chart-4/10 text-chart-4 ring-chart-4/20',
  Marketing: 'bg-chart-3/10 text-chart-3 ring-chart-3/20',
  Finance: 'bg-chart-2/10 text-chart-2 ring-chart-2/20',
  Ventes: 'bg-chart-5/10 text-chart-5 ring-chart-5/20',
};

function departmentChip(department: string | null | undefined = '—') {
  const d = department;
  const tone =
    (d && departmentTones[d]) ??
    'bg-muted text-muted-foreground ring-muted-foreground/15';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tone}`}
    >
      {d}
    </span>
  );
}

type EmployeeFormValues = z.infer<ReturnType<typeof createEmployeeSchema>>;

export default function EmployeesPage() {
  const { dict } = useI18n();
  const t = dict.employees;
  const { user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'HR');
  const {
    data: employees,
    loading,
    error,
    refetch,
  } = useApi('employees.list', () => employeesApi.list());
  const users = useApi('users.list', () => usersApi.list());
  const [search, setSearch] = React.useState('');
  const [department, setDepartment] = React.useState('all');

  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users.data != undefined) {
      for (const u of users.data) m.set(u.id, u);
    }
    return m;
  }, [users.data]);

  // Only candidates can become employees: exclude HR/admins, users already
  // converted to employees, and anything without a candidate role.
  const candidateUsers = React.useMemo(() => {
    const taken = new Set((employees ?? []).map((e) => e.userId));
    return (users.data ?? []).filter(
      (u) => u.role?.toUpperCase() === 'CANDIDATE' && !taken.has(u.id)
    );
  }, [users.data, employees]);

  const departments = React.useMemo(() => {
    return [
      ...new Set(
        (employees ?? [])
          .map((e) => e.department)
          .filter((d): d is string => Boolean(d))
      ),
    ].toSorted((a, b) => a.localeCompare(b));
  }, [employees]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return (employees ?? []).filter((e) => {
      if (department !== 'all' && e.department !== department) return false;
      if (!search.trim()) return true;
      const u = userMap.get(e.userId);
      const name = fullName(u?.name, u?.lastname).toLowerCase();
      return (
        name.includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q) ||
        e.employeeCode?.toLowerCase().includes(q)
      );
    });
  }, [employees, search, department, userMap]);

  const activeCount = (employees ?? []).filter((e) => e.active).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.departments ?? ''}
        title={t.title}
        description={t.count
          .split('{count}')
          .join(String(employees?.length ?? 0))}
        icon={<Users className="size-6" />}
        actions={
          canManage ? <AddEmployeeDialog users={candidateUsers} /> : undefined
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryTile
          label={t.employeesTotal ?? t.title}
          value={employees?.length ?? 0}
          hint={`${activeCount} ${t.active}`}
          icon={<Users className="size-4" />}
          tone="bg-primary/10 text-primary"
        />
        <SummaryTile
          label={t.departments}
          value={departments.length}
          hint={t.count.split('{count}').join(String(departments.length))}
          icon={<Briefcase className="size-4" />}
          tone="bg-chart-4/10 text-chart-4"
        />
        <SummaryTile
          label={t.active}
          value={activeCount}
          hint={`${(employees?.length ?? 0) - activeCount} ${t.inactive}`}
          icon={<Users className="size-4" />}
          tone="bg-chart-2/10 text-chart-2"
        />
      </div>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute inset-s-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted/40 ps-9"
              />
            </div>
            <Combobox
              items={['all', ...departments]}
              value={department}
              onValueChange={(v) => setDepartment(v ?? 'all')}
            >
              <ComboboxInput
                placeholder={t.allDepartments}
                className="w-full sm:w-52"
              />
              <ComboboxContent>
                <ComboboxEmpty>No results found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item === 'all' ? t.allDepartments : item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <span className="text-muted-foreground ms-auto hidden text-xs sm:inline">
              {filtered.length}/{employees?.length ?? 0}
            </span>
          </div>

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
              icon={<Users className="size-6" />}
              title={
                search || department !== 'all' ? t.noResults : t.noEmployees
              }
              description={
                search || department !== 'all'
                  ? t.tryAnotherSearch
                  : t.addFirstEmployee
              }
              action={
                search || department !== 'all'
                  ? undefined
                  : canManage && <AddEmployeeDialog users={candidateUsers} />
              }
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.code}</TableHead>
                    <TableHead>{t.department}</TableHead>
                    <TableHead>{t.position}</TableHead>
                    <TableHead>{t.hireDate}</TableHead>
                    <TableHead className="text-end">{t.salary}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const u = userMap.get(e.userId);
                    return (
                      <TableRow key={e.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="ring-primary/10 size-9 ring-1">
                              <AvatarImage src={u?.profileImageUrl} />
                              <AvatarFallback>
                                {initials(u?.name, u?.lastname)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {fullName(u?.name, u?.lastname)}
                              </p>
                              <p className="text-muted-foreground truncate text-xs">
                                {u?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-mono text-[11px]">
                            {e.employeeCode}
                          </span>
                        </TableCell>
                        <TableCell>{departmentChip(e.department)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {e.position || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(e.hireDate)}
                        </TableCell>
                        <TableCell className="text-end font-semibold tabular-nums">
                          {formatCurrency(e.salary)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={e.active ? 'ACTIVE' : 'INACTIVE'}
                          />
                        </TableCell>
                        <TableCell>
                          <RowActions employee={e} userMap={userMap} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell colSpan={8} className="py-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {filtered.length}{' '}
                        {filtered.length > 1 ? t.employees : t.employee}
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

function SummaryTile({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-2xl border p-4 shadow-sm">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-lg leading-tight font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        {hint && (
          <p className="text-muted-foreground/70 truncate text-[11px]">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function RowActions({
  employee,
  userMap,
}: {
  employee: EmployeeResponse;
  userMap: Map<number, User>;
}) {
  const { dict } = useI18n();
  const t = dict.employees;
  const { user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'HR');
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const u = userMap.get(employee.userId);

  // Deactivation is a soft delete: the backend flips `active` instead of
  // removing the row, since attendance/contracts/leaves/payroll reference it.
  const statusMutation = useApiMutation<
    { id: number; isActive: boolean },
    EmployeeResponse
  >(({ id, isActive }) => employeesApi.setActive(id, isActive), {
    invalidate: ['employees.list', 'dashboard.get'],
    onSuccess: (_data, vars) => {
      toast.add({
        type: 'success',
        description: vars.isActive
          ? t.successReactivated
          : t.successDeactivated,
      });
      setConfirmOpen(false);
    },
    onError: (err) => toast.add({ type: 'error', description: err.message }),
  });

  if (!canManage) return;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={t.actions} />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setQrOpen(true)}>
            <QrCode /> {t.viewQrCode}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Pencil /> {t.edit}
          </DropdownMenuItem>
          {employee.active ? (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 /> {t.deactivate}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
              <UserPlus /> {t.reactivate}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditEmployeeDialog
        isOpen={open}
        onOpenChange={setOpen}
        employee={employee}
      />

      <EmployeeQrDialog
        employee={employee}
        employeeName={fullName(u?.name, u?.lastname)}
        isOpen={qrOpen}
        onOpenChange={setQrOpen}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {employee.active ? t.deactivateConfirm : t.reactivateConfirm}
            </DialogTitle>
            <DialogDescription>
              {(employee.active
                ? t.deactivateConfirmMessage
                : t.reactivateConfirmMessage
              )
                .split('{name}')
                .join(fullName(u?.name, u?.lastname))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.cancel}
            </Button>
            {employee.active ? (
              <Button
                variant="destructive"
                onClick={() =>
                  statusMutation.mutate({ id: employee.id, isActive: false })
                }
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? t.deactivating : t.deactivate}
              </Button>
            ) : (
              <Button
                onClick={() =>
                  statusMutation.mutate({ id: employee.id, isActive: true })
                }
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? t.reactivating : t.reactivate}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmployeeQrDialog({
  employee,
  employeeName,
  isOpen,
  onOpenChange,
}: {
  employee: EmployeeResponse;
  employeeName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const { dict } = useI18n();
  const t = dict.employees;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t.qrDialogTitle.split('{name}').join(employeeName)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {employee.qrImageUrl ? (
            <>
              <Image
                src={employee.qrImageUrl}
                alt={t.qrDialogTitle.split('{name}').join(employeeName)}
                width={240}
                height={240}
                className="size-60 rounded-xl ring-1 ring-black/10"
              />
              <span className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-mono text-[11px]">
                {employee.employeeCode}
              </span>
            </>
          ) : (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {t.noQrCode}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddEmployeeDialog({ users }: { users: User[] }) {
  const { dict } = useI18n();
  const t = dict.employees;
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> {t.addEmployee}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.addDialogTitle}</DialogTitle>
          <DialogDescription>{t.addDialogDesc}</DialogDescription>
        </DialogHeader>
        <EmployeeForm users={users} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditEmployeeDialog({
  isOpen,
  onOpenChange,
  employee,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  employee: EmployeeResponse;
}) {
  const { dict } = useI18n();
  const t = dict.employees;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.editDialogTitle}</DialogTitle>
          <DialogDescription>
            {t.editDialogDesc.split('{code}').join(String(employee.id))}
          </DialogDescription>
        </DialogHeader>
        <EmployeeForm
          initial={{
            id: employee.id,
            userId: employee.userId,
            department: employee.department ?? '',
            position: employee.position ?? '',
            contractType: employee.contractType ?? 'CDI',
            salary: employee.salary ?? 0,
          }}
          lockedUser
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({
  users,
  initial,
  lockedUser,
  onSuccess,
}: {
  users?: User[];
  initial?: EmployeeFormValues & { id: number };
  lockedUser?: boolean;
  onSuccess: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.employees;
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema(dict.validation)),
    defaultValues: initial
      ? {
          userId: initial.userId,
          department: initial.department,
          position: initial.position,
          contractType: initial.contractType,
          salary: initial.salary,
        }
      : {
          userId: undefined,
          department: '',
          position: '',
          contractType: 'CDI',
          salary: 0,
          contractStartDate: '',
          contractEndDate: '',
          workingHours: 40,
        },
  });

  const createMutation = useApiMutation<EmployeeFormValues, EmployeeResponse>(
    (body) => employeesApi.create(body),
    {
      invalidate: ['employees.list', 'dashboard.get'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.successAdded });
        onSuccess();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  const updateMutation = useApiMutation<
    { id: number; body: EmployeeFormValues },
    EmployeeResponse
  >(({ id, body }) => employeesApi.update(id, body), {
    invalidate: ['employees.list', 'dashboard.get'],
    onSuccess: () => {
      toast.add({ type: 'success', description: t.successModified });
      onSuccess();
    },
    onError: (err) => toast.add({ type: 'error', description: err.message }),
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: EmployeeFormValues) {
    if (initial) {
      updateMutation.mutate({ id: initial.id, body: values });
    } else {
      // Empty date strings would break LocalDate parsing: omit them
      const { contractStartDate, contractEndDate, ...rest } = values;
      createMutation.mutate({
        ...rest,
        ...(contractStartDate && { contractStartDate }),
        ...(contractEndDate && { contractEndDate }),
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-1">
      <FieldGroup>
        {!lockedUser && (
          <Controller
            control={form.control}
            name="userId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-user">{t.user}</FieldLabel>
                <UserCombobox
                  users={users ?? []}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? 0)}
                  placeholder={t.selectUser}
                  id="employee-user"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="department"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-department">
                  {t.department}
                </FieldLabel>
                <Input
                  {...field}
                  id="employee-department"
                  aria-invalid={fieldState.invalid}
                  placeholder="Ex. Ingénierie"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="position"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-position">
                  {t.position}
                </FieldLabel>
                <Input
                  {...field}
                  id="employee-position"
                  aria-invalid={fieldState.invalid}
                  placeholder="Ex. Développeur full-stack"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="contractType"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-contract">
                  {t.contractType}
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="employee-contract"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
          <Controller
            control={form.control}
            name="salary"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="employee-salary">{t.salary}</FieldLabel>
                <Input
                  {...field}
                  id="employee-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  aria-invalid={fieldState.invalid}
                  placeholder="Ex. 2500"
                  value={field.value === 0 ? '' : field.value}
                  onChange={(e) => {
                    return field.onChange(
                      e.target.value === '' ? 0 : e.target.valueAsNumber
                    );
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {!initial && (
          <div className="bg-muted/30 space-y-4 rounded-xl border p-4">
            <p className="text-sm font-medium">{t.contractSection}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="contractStartDate"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{t.contractStart}</FieldLabel>
                    <DatePicker
                      value={field.value ?? ''}
                      onChange={(v) => field.onChange(v ?? '')}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{t.contractEnd}</FieldLabel>
                    <DatePicker
                      value={field.value ?? ''}
                      onChange={(v) => field.onChange(v ?? '')}
                    />
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="workingHours"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="employee-hours">
                    {t.workingHours}
                  </FieldLabel>
                  <Input
                    id="employee-hours"
                    type="number"
                    min="0"
                    max="168"
                    aria-invalid={fieldState.invalid}
                    value={field.value ?? 40}
                    onChange={(e) => {
                      return field.onChange(
                        e.target.value === '' ? 40 : e.target.valueAsNumber
                      );
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        )}
      </FieldGroup>

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isBusy}>
          {isBusy ? t.saving : initial ? t.saveChanges : t.addEmployeeButton}
        </Button>
      </DialogFooter>
    </form>
  );
}
