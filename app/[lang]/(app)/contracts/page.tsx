'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  FileSignature,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { createContractSchema } from '@/lib/schemas/contracts';
import { contractsApi } from '@/lib/services/contracts';
import { employeesApi } from '@/lib/services/employees';
import { usersApi } from '@/lib/services/users';
import type { ContractResponse } from '@/lib/types/contracts';
import type { EmployeeResponse } from '@/lib/types/employees';
import type { User } from '@/lib/types/users';
import { formatCurrency, formatDate, fullName } from '@/lib/format';
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

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Internship'];

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  Freelance: 'Freelance',
  Internship: 'Stage',
};

type ContractFormValues = z.infer<ReturnType<typeof createContractSchema>>;

export default function ContractsPage() {
  const { dict } = useI18n();
  const t = dict.contracts;
  const {
    data: contracts,
    loading,
    error,
    refetch,
  } = useApi('contracts.list', () => contractsApi.list());
  const employees = useApi('employees.list', () => employeesApi.list());
  const users = useApi('users.list', () => usersApi.list());

  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users.data != undefined) {
      for (const u of users.data) m.set(u.id, u);
    }
    return m;
  }, [users.data]);

  const employeeMap = React.useMemo(() => {
    const m = new Map<number, EmployeeResponse>();
    if (employees.data != undefined) {
      for (const e of employees.data) m.set(e.id, e);
    }
    return m;
  }, [employees.data]);

  const active = (contracts ?? []).filter((c) => c.status === 'ACTIVE').length;
  const expired = (contracts ?? []).filter(
    (c) => c.status === 'EXPIRED'
  ).length;
  const totalMonthly = (contracts ?? []).reduce(
    (sum, c) => sum + (c.salary ?? 0),
    0
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.title}
        description={t.count
          .split('{count}')
          .join(String(contracts?.length ?? 0))}
        actions={
          <AddContractDialog
            employees={employees.data ?? []}
            userMap={userMap}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.active}
          value={active}
          hint={t.activeHint}
          icon={<FileSignature className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.expired}
          value={expired}
          hint={t.expiredHint}
          icon={<FileSignature className="size-5" />}
          accent="danger"
        />
        <StatCard
          label={t.payroll}
          value={formatCurrency(totalMonthly)}
          hint={t.payrollHint}
          icon={<FileSignature className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.averageSalary}
          value={formatCurrency(
            (contracts?.length ?? 0) > 0
              ? totalMonthly / (contracts?.length ?? 1)
              : 0
          )}
          hint={t.averageSalaryHint}
          icon={<FileSignature className="size-5" />}
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
          ) : (contracts ?? []).length === 0 ? (
            <EmptyState
              icon={<FileSignature className="size-6" />}
              title={t.noContracts}
              description={t.noContractsDesc}
              action={
                <AddContractDialog
                  employees={employees.data ?? []}
                  userMap={userMap}
                />
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.type}</TableHead>
                    <TableHead>{t.startDate}</TableHead>
                    <TableHead>{t.endDate}</TableHead>
                    <TableHead>{t.hoursPerWeek}</TableHead>
                    <TableHead>{t.salary}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(contracts ?? []).map((contract) => {
                    const employee = employeeMap.get(contract.employeeId);
                    const user = userMap.get(employee?.userId ?? -1);
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="text-sm font-medium">
                          {fullName(user?.name, user?.lastname)}
                        </TableCell>
                        <TableCell>
                          {CONTRACT_TYPE_LABELS[contract.contractType] ??
                            contract.contractType}
                        </TableCell>
                        <TableCell>{formatDate(contract.startDate)}</TableCell>
                        <TableCell>{formatDate(contract.endDate)}</TableCell>
                        <TableCell>{`${contract.workingHours} ${t.workingHoursUnit}`}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(contract.salary)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={contract.status} />
                        </TableCell>
                        <TableCell>
                          <RowActions contract={contract} />
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

function RowActions({ contract }: { contract: ContractResponse }) {
  const { dict } = useI18n();
  const t = dict.contracts;
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const deleteMutation = useApiMutation<number, string>(
    (id) => contractsApi.remove(id),
    {
      invalidate: ['contracts.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successDeleted);
        setConfirmOpen(false);
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

      <EditContractDialog
        isOpen={open}
        onOpenChange={setOpen}
        contract={contract}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteConfirm}</DialogTitle>
            <DialogDescription>{t.deleteConfirmDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(contract.id)}
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

function AddContractDialog({
  employees,
  userMap,
}: {
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
}) {
  const { dict } = useI18n();
  const t = dict.contracts;
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.addContract}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.addDialogTitle}</DialogTitle>
          <DialogDescription>{t.addDialogDesc}</DialogDescription>
        </DialogHeader>
        <ContractForm
          employees={employees}
          userMap={userMap}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditContractDialog({
  isOpen,
  onOpenChange,
  contract,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contract: ContractResponse;
}) {
  const { dict } = useI18n();
  const t = dict.contracts;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.editDialogTitle}</DialogTitle>
          <DialogDescription>
            {t.editDialogDesc.split('{code}').join(String(contract.id))}
          </DialogDescription>
        </DialogHeader>
        <ContractForm
          initial={{
            id: contract.id,
            employeeId: contract.employeeId,
            contractType: contract.contractType,
            startDate: contract.startDate,
            endDate: contract.endDate,
            salary: contract.salary,
            workingHours: contract.workingHours,
          }}
          lockedEmployee
          onSuccess={() => onOpenChange(false)}
        />{' '}
      </DialogContent>
    </Dialog>
  );
}

function ContractForm({
  employees,
  userMap,
  initial,
  lockedEmployee,
  onSuccess,
}: {
  employees?: EmployeeResponse[];
  userMap?: Map<number, User>;
  initial?: ContractFormValues & { id: number };
  lockedEmployee?: boolean;
  onSuccess: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.contracts;
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(createContractSchema(dict.validation)),
    defaultValues: initial
      ? {
          employeeId: initial.employeeId,
          contractType: initial.contractType,
          startDate: initial.startDate,
          endDate: initial.endDate,
          salary: initial.salary,
          workingHours: initial.workingHours,
        }
      : {
          employeeId: 0,
          contractType: 'CDI',
          startDate: '',
          endDate: '',
          salary: 0,
          workingHours: 40,
        },
  });

  const createMutation = useApiMutation<ContractFormValues, ContractResponse>(
    (body) => {
      return contractsApi.create(body.employeeId, {
        contractType: body.contractType,
        startDate: body.startDate,
        endDate: body.endDate,
        salary: body.salary,
        workingHours: body.workingHours,
      });
    },
    {
      invalidate: ['contracts.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successCreated);
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const updateMutation = useApiMutation<
    { id: number; body: ContractFormValues },
    ContractResponse
  >(
    ({ id, body }) => {
      return contractsApi.update(id, {
        contractType: body.contractType,
        startDate: body.startDate,
        endDate: body.endDate,
        salary: body.salary,
        workingHours: body.workingHours,
      });
    },
    {
      invalidate: ['contracts.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successUpdated);
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const isBusy = createMutation.isPending || updateMutation.isPending;

  function onSubmit(values: ContractFormValues) {
    if (initial) {
      updateMutation.mutate({ id: initial.id, body: values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-1">
      <FieldGroup>
        {!lockedEmployee && (
          <Controller
            control={form.control}
            name="employeeId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-employee">
                  {t.employee}
                </FieldLabel>
                <Select
                  name={field.name}
                  value={String(field.value || '')}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger
                    id="contract-employee"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder={t.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {employeeOptions(employees ?? [], userMap ?? new Map()).map(
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
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="contractType"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-type">
                  {t.contractType}
                </FieldLabel>
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="contract-type"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {CONTRACT_TYPE_LABELS[type] ?? type}
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
            name="workingHours"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-hours">
                  {t.weeklyHours}
                </FieldLabel>
                <Input
                  {...field}
                  id="contract-hours"
                  type="number"
                  min="1"
                  aria-invalid={fieldState.invalid}
                  value={field.value || ''}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="startDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-start">{t.start}</FieldLabel>
                <DatePicker
                  id="contract-start"
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
                <FieldLabel htmlFor="contract-end">{t.end}</FieldLabel>
                <DatePicker
                  id="contract-end"
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
          name="salary"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contract-salary">{t.salaryLabel}</FieldLabel>
              <Input
                {...field}
                id="contract-salary"
                type="number"
                min="0"
                step="0.01"
                aria-invalid={fieldState.invalid}
                placeholder={t.salaryPlaceholder}
                value={field.value === 0 ? '' : field.value}
                onChange={(e) => {
                  return field.onChange(
                    e.target.value === '' ? 0 : e.target.valueAsNumber
                  );
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isBusy}>
          {isBusy ? t.recording : initial ? t.saveChanges : t.createContract}
        </Button>
      </DialogFooter>
    </form>
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
