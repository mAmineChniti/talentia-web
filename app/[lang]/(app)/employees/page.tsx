'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Internship'];

type EmployeeFormValues = z.infer<ReturnType<typeof createEmployeeSchema>>;

export default function EmployeesPage() {
  const { dict } = useI18n();
  const t = dict.employees;
  const {
    data: employees,
    loading,
    error,
    refetch,
  } = useApi('employees.list', () => employeesApi.list());
  const users = useApi('users.list', () => usersApi.list());
  const [search, setSearch] = React.useState('');

  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users.data != undefined) {
      for (const u of users.data) m.set(u.id, u);
    }
    return m;
  }, [users.data]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return employees ?? [];
    const q = search.toLowerCase();
    return (employees ?? []).filter((e) => {
      const u = userMap.get(e.userId);
      const name = fullName(u?.name, u?.lastname).toLowerCase();
      return (
        name.includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q) ||
        e.employeeCode?.toLowerCase().includes(q)
      );
    });
  }, [employees, search, userMap]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.title}
        description={t.count
          .split('{count}')
          .join(String(employees?.length ?? 0))}
        actions={<AddEmployeeDialog users={users.data ?? []} />}
      />

      <Card className="rounded-lg py-0">
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {error ? (
            <ErrorState onRetry={refetch} description={error.message} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => {
                return <Skeleton key={i} className="h-12 w-full" />;
              })}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title={search ? t.noResults : t.noEmployees}
              description={search ? t.tryAnotherSearch : t.addFirstEmployee}
              action={
                search ? undefined : (
                  <AddEmployeeDialog users={users.data ?? []} />
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.code}</TableHead>
                    <TableHead>{t.department}</TableHead>
                    <TableHead>{t.position}</TableHead>
                    <TableHead>{t.hireDate}</TableHead>
                    <TableHead>{t.salary}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => {
                    const u = userMap.get(e.userId);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
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
                        <TableCell className="font-mono text-xs">
                          {e.employeeCode}
                        </TableCell>
                        <TableCell>{e.department || '—'}</TableCell>
                        <TableCell>{e.position || '—'}</TableCell>
                        <TableCell>{formatDate(e.hireDate)}</TableCell>
                        <TableCell className="font-medium">
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
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t.actions}>
            <MoreHorizontal />
          </Button>
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
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.addEmployee}
        </Button>
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
                  <SelectContent position="item-aligned">
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
                  <SelectContent position="item-aligned">
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
