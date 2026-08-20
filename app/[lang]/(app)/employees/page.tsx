'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import { StatusBadge } from '@/components/status-badge';
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
import { toast } from 'sonner';

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
          canManage ? <AddEmployeeDialog users={users.data ?? []} /> : undefined
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
          label={t.departments ?? 'Départements'}
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
              <Search className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted/40 ps-9"
              />
            </div>
            <Select
              value={department}
              onValueChange={(v) => setDepartment(v ?? 'all')}
            >
              <SelectTrigger
                className="w-full sm:w-52"
                aria-label={t.department}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allDepartments}</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  : canManage && <AddEmployeeDialog users={users.data ?? []} />
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
  const u = userMap.get(employee.userId);
  const employeeName = fullName(u?.name, u?.lastname);

  const deleteMutation = useApiMutation<number, string>(
    (id) => employeesApi.remove(id),
    {
      invalidate: ['employees.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successDeleted.split('{name}').join(employeeName));
      },
      onError: (err) => toast.error(err.message),
    }
  );

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
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <Pencil /> {t.edit}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2 /> {t.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditEmployeeDialog
        isOpen={open}
        onOpenChange={setOpen}
        employee={employee}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteConfirm}</DialogTitle>
            <DialogDescription>
              {t.deleteConfirmMessage
                .split('{name}')
                .join(fullName(u?.name, u?.lastname))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(employee.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.deleting : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
          userId: 0,
          department: '',
          position: '',
          contractType: 'CDI',
          salary: 0,
        },
  });

  const createMutation = useApiMutation<EmployeeFormValues, EmployeeResponse>(
    (body) => employeesApi.create(body),
    {
      invalidate: ['employees.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successAdded);
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const updateMutation = useApiMutation<
    { id: number; body: EmployeeFormValues },
    EmployeeResponse
  >(({ id, body }) => employeesApi.update(id, body), {
    invalidate: ['employees.list', 'dashboard.get'],
    onSuccess: () => {
      toast.success(t.successModified);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: EmployeeFormValues) {
    if (initial) {
      updateMutation.mutate({ id: initial.id, body: values });
    } else {
      createMutation.mutate(values);
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
                <Select
                  name={field.name}
                  value={String(field.value || '')}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger
                    id="employee-user"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder={t.selectUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {fullName(u.name, u.lastname)} — {u.email}
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
      </FieldGroup>

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isBusy}>
          {isBusy ? t.saving : initial ? t.saveChanges : t.addEmployeeButton}
        </Button>
      </DialogFooter>
    </form>
  );
}
