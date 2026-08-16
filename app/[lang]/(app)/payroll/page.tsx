'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { Plus, Sparkles, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import {
  createPayrollSchema,
  createGeneratePayrollSchema,
} from '@/lib/schemas/payroll';
import { employeesApi } from '@/lib/services/employees';
import { payrollApi } from '@/lib/services/payroll';
import { usersApi } from '@/lib/services/users';
import type { EmployeeResponse } from '@/lib/types/employees';
import type { PayrollResponse } from '@/lib/types/payroll';
import type { User } from '@/lib/types/users';
import { formatCurrency, fullName, monthName } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
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

const thisYear = () => {
  const now = new Date();
  return now.getFullYear();
};
const thisMonth = () => {
  const now = new Date();
  return now.getMonth() + 1;
};

type GenerateFormValues = z.infer<
  ReturnType<typeof createGeneratePayrollSchema>
>;

type PayrollFormValues = z.infer<ReturnType<typeof createPayrollSchema>>;

const periodLabel = (month: number, year: number) =>
  `${monthName(month)} ${year}`;

export default function PayrollPage() {
  const { dict } = useI18n();
  const t = dict.payroll;
  const {
    data: payroll,
    loading,
    error,
    refetch,
  } = useApi('payroll.list', () => payrollApi.list());
  const employees = useApi('employees.list', () => employeesApi.list());
  const users = useApi('users.list', () => usersApi.list());

  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users.data != undefined) {
      for (const u of users.data) m.set(u.id, u);
    }
    return m;
  }, [users.data]);

  const totalNet = (payroll ?? []).reduce((s, p) => s + p.netSalary, 0);
  const totalBonus = (payroll ?? []).reduce((s, p) => s + p.bonus, 0);
  const totalDeductions = (payroll ?? []).reduce((s, p) => s + p.deduction, 0);
  const count = payroll?.length ?? 0;
  const periodSet = new Set((payroll ?? []).map((p) => `${p.month}/${p.year}`));

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.title}
        description={t.description
          .split('{count}')
          .join(String(count))
          .split('{periods}')
          .join(String(periodSet.size))}
        actions={
          <>
            <GenerateAllDialog />
            <AddPayrollDialog
              employees={employees.data ?? []}
              userMap={userMap}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.netTotal}
          value={formatCurrency(totalNet)}
          hint={t.netTotalHint}
          icon={<Wallet className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.bonus}
          value={formatCurrency(totalBonus)}
          hint={t.bonusHint}
          icon={<Sparkles className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.deductions}
          value={formatCurrency(totalDeductions)}
          hint={t.deductionsHint}
          icon={<Wallet className="size-5" />}
          accent="danger"
        />
        <StatCard
          label={t.averageNet}
          value={formatCurrency(count > 0 ? totalNet / count : 0)}
          hint={t.averageNetHint}
          icon={<Wallet className="size-5" />}
          accent="info"
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
          ) : count === 0 ? (
            <EmptyState
              icon={<Wallet className="size-6" />}
              title={t.noPayroll}
              description={t.noPayrollDesc}
              action={<GenerateAllDialog />}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.period}</TableHead>
                    <TableHead className="text-right">{t.baseSalary}</TableHead>
                    <TableHead className="text-right">{t.bonusLabel}</TableHead>
                    <TableHead className="text-right">{t.overtime}</TableHead>
                    <TableHead className="text-right">{t.deduction}</TableHead>
                    <TableHead className="text-right">{t.net}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(payroll ?? [])]
                    .toSorted((a, b) => {
                      return (
                        b.year - a.year ||
                        b.month - a.month ||
                        a.employeeName.localeCompare(b.employeeName)
                      );
                    })
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium">
                          {p.employeeName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {periodLabel(p.month, p.year)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(p.baseSalary)}
                        </TableCell>
                        <TableCell className="text-chart-2 text-right">
                          +{formatCurrency(p.bonus)}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.overtime ? `+${formatCurrency(p.overtime)}` : '—'}
                        </TableCell>
                        <TableCell className="text-destructive text-right">
                          {p.deduction
                            ? `−${formatCurrency(p.deduction)}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(p.netSalary)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PeriodFields({
  idPrefix,
  month,
  onMonthChange,
  year,
  onYearChange,
}: {
  idPrefix: string;
  month: number;
  onMonthChange: (value: number) => void;
  year: number;
  onYearChange: (value: number) => void;
}) {
  const { dict } = useI18n();
  const t = dict.payroll;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-month`}>{t.month}</FieldLabel>
        <Select
          name="month"
          value={String(month)}
          onValueChange={(v) => onMonthChange(Number(v))}
        >
          <SelectTrigger id={`${idPrefix}-month`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {monthName(i + 1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-year`}>{t.year}</FieldLabel>
        <Input
          name="year"
          type="number"
          min="2000"
          max="2100"
          value={year || ''}
          onChange={(e) =>
            onYearChange(e.target.value === '' ? 0 : e.target.valueAsNumber)
          }
        />
      </Field>
    </div>
  );
}

function GenerateAllDialog() {
  const { dict } = useI18n();
  const t = dict.payroll;
  const [open, setOpen] = React.useState(false);
  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(createGeneratePayrollSchema(dict.validation)),
    defaultValues: {
      month: thisMonth(),
      year: thisYear(),
      bonusPercentage: 0,
    },
  });
  const watchedMonth = useWatch({ control: form.control, name: 'month' });
  const watchedYear = useWatch({ control: form.control, name: 'year' });

  const generateMutation = useApiMutation<
    GenerateFormValues,
    PayrollResponse[]
  >(
    ({ month, year, bonusPercentage }) =>
      payrollApi.generate(month, year, bonusPercentage),
    {
      invalidate: ['payroll.list', 'dashboard.get'],
      onSuccess: (data) => {
        toast.success(
          t.successGenerated.split('{count}').join(String(data.length))
        );
        setOpen(false);
        form.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o)
          form.reset({
            month: thisMonth(),
            year: thisYear(),
            bonusPercentage: 0,
          });
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles /> {t.generateAll}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.generateDialogTitle}</DialogTitle>
          <DialogDescription>{t.generateDialogDesc}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            generateMutation.mutate(values)
          )}
          className="grid gap-4 py-1"
        >
          <FieldGroup>
            <PeriodFields
              idPrefix="generate"
              month={watchedMonth}
              year={watchedYear}
              onMonthChange={(v) => form.setValue('month', v)}
              onYearChange={(v) => form.setValue('year', v)}
            />
            <Controller
              control={form.control}
              name="bonusPercentage"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="generate-bonus">
                    {t.bonusPercentage}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="generate-bonus"
                    type="number"
                    min="0"
                    step="0.5"
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
          </FieldGroup>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? t.generating : t.generatePayroll}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPayrollDialog({
  employees,
  userMap,
}: {
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
}) {
  const { dict } = useI18n();
  const t = dict.payroll;
  const [open, setOpen] = React.useState(false);
  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(createPayrollSchema(dict.validation)),
    defaultValues: {
      employeeId: 0,
      month: thisMonth(),
      year: thisYear(),
      bonus: 0,
    },
  });
  const watchedMonth = useWatch({ control: form.control, name: 'month' });
  const watchedYear = useWatch({ control: form.control, name: 'year' });

  const createMutation = useApiMutation<PayrollFormValues, PayrollResponse>(
    (body) => {
      return payrollApi.create({
        employeeId: body.employeeId,
        month: body.month,
        year: body.year,
        bonus: body.bonus,
      });
    },
    {
      invalidate: ['payroll.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successCreated);
        setOpen(false);
        form.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.addPayroll}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.addDialogTitle}</DialogTitle>
          <DialogDescription>{t.addDialogDesc}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(values)
          )}
          className="grid gap-4 py-1"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="employeeId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="payroll-employee">
                    {t.employee}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={String(field.value || '')}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger
                      id="payroll-employee"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder={t.selectEmployee} />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {employeeOptions(employees, userMap).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name}
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
            <PeriodFields
              idPrefix="payroll"
              month={watchedMonth}
              year={watchedYear}
              onMonthChange={(v) => form.setValue('month', v)}
              onYearChange={(v) => form.setValue('year', v)}
            />
            <Controller
              control={form.control}
              name="bonus"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="payroll-bonus">
                    {t.bonusLabelForm}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="payroll-bonus"
                    type="number"
                    min="0"
                    step="0.01"
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
          </FieldGroup>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t.recording : t.createSlip}
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
