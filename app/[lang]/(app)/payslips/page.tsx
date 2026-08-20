'use client';

import * as React from 'react';
import {
  BadgeCheck,
  CalendarClock,
  Download,
  FileText,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { payrollApi } from '@/lib/services/payroll';
import { payslipsApi } from '@/lib/services/payslips';
import type { PayrollResponse } from '@/lib/types/payroll';
import type { PayslipResponse } from '@/lib/types/payslips';
import { formatCurrency, formatDateTime, monthName } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

const periodKey = (employeeName: string, month: number, year: number) =>
  `${employeeName}|${month}|${year}`;

const basename = (path: string) => path.split(/[\\/]/).pop() ?? path;

export default function PayslipsPage() {
  const { dict } = useI18n();
  const t = dict.payslips;
  const { user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'ADMIN');
  const {
    data: payslips,
    loading,
    error,
    refetch,
  } = useApi('payslips.list', () => payslipsApi.list());
  const payroll = useApi('payroll.list', () => payrollApi.list());

  const generatedKeys = React.useMemo(() => {
    return new Set(
      (payslips ?? []).map((p) => periodKey(p.employeeName, p.month, p.year))
    );
  }, [payslips]);
  const availablePayrolls = React.useMemo(() => {
    return (payroll.data ?? []).filter(
      (p) => !generatedKeys.has(periodKey(p.employeeName, p.month, p.year))
    );
  }, [payroll.data, generatedKeys]);

  const totalNet = (payslips ?? []).reduce((s, p) => s + p.netSalary, 0);
  const count = payslips?.length ?? 0;

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.pdf}
        title={t.title}
        description={t.description
          .split('{count}')
          .join(String(count))
          .split('{s}')
          .join(count > 1 ? 's' : '')}
        icon={<FileText className="size-6" />}
        actions={
          canManage ? (
            <GeneratePayslipDialog
              payrolls={availablePayrolls}
              disabled={availablePayrolls.length === 0}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.issued}
          value={count}
          hint={t.issuedHint}
          icon={<BadgeCheck className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.netTotal}
          value={formatCurrency(totalNet)}
          hint={t.netTotalHint}
          icon={<Wallet className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.averageNet}
          value={formatCurrency(count > 0 ? totalNet / count : 0)}
          hint={t.averageNetHint}
          icon={<Wallet className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.readyToGenerate}
          value={availablePayrolls.length}
          hint={t.readyToGenerateHint}
          icon={<Sparkles className="size-5" />}
          accent="warning"
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
          ) : count === 0 ? (
            <EmptyState
              icon={<FileText className="size-6" />}
              title={t.noPayslips}
              description={t.noPayslipsDesc}
              action={
                canManage ? (
                  <GeneratePayslipDialog
                    payrolls={availablePayrolls}
                    disabled={availablePayrolls.length === 0}
                  />
                ) : undefined
              }
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t.employee}</TableHead>
                    <TableHead>{t.period}</TableHead>
                    <TableHead className="text-end">{t.baseSalary}</TableHead>
                    <TableHead className="text-end">{t.bonus}</TableHead>
                    <TableHead className="text-end">{t.netSalary}</TableHead>
                    <TableHead>{t.generated}</TableHead>
                    <TableHead className="w-32 text-end">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(payslips ?? [])]
                    .toSorted((a, b) => {
                      return (
                        b.year - a.year ||
                        b.month - a.month ||
                        a.employeeName.localeCompare(b.employeeName)
                      );
                    })
                    .map((p) => (
                      <TableRow key={p.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="ring-primary/10 size-9 ring-1">
                              <AvatarFallback>
                                {p.employeeName
                                  ?.split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm font-medium">
                              {p.employeeName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                            {monthName(p.month)} {p.year}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-end tabular-nums">
                          {formatCurrency(p.baseSalary)}
                        </TableCell>
                        <TableCell className="text-chart-2 text-end tabular-nums">
                          +{formatCurrency(p.bonus)}
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="bg-chart-2/10 text-chart-2 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums">
                            {formatCurrency(p.netSalary)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <CalendarClock className="size-3.5" />
                            {formatDateTime(p.generatedDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-end">
                          {p.pdfPath ? (
                            <Button
                              variant="outline"
                              size="sm"
                              nativeButton={false}
                              render={
                                <a
                                  href={payslipsApi.downloadUrl(
                                    basename(p.pdfPath)
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                />
                              }
                            >
                              <Download /> {t.download}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell colSpan={7} className="py-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {count} {t.issued}
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

function GeneratePayslipDialog({
  payrolls,
  disabled,
}: {
  payrolls: PayrollResponse[];
  disabled: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.payslips;
  const [open, setOpen] = React.useState(false);
  const [payrollId, setPayrollId] = React.useState<number>(0);

  const generateMutation = useApiMutation<number, PayslipResponse>(
    (id) => payslipsApi.generate(id),
    {
      invalidate: ['payslips.list'],
      onSuccess: (data) => {
        toast.success(
          t.successGenerated.split('{name}').join(data.employeeName)
        );
        setOpen(false);
        setPayrollId(0);
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const selected = payrolls.find((p) => p.id === payrollId);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setPayrollId(0);
      }}
    >
      <DialogTrigger render={<Button disabled={disabled} />}>
        <Sparkles /> {t.generate}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.generateDialogTitle}</DialogTitle>
          <DialogDescription>{t.generateDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="space-y-2">
            <label
              htmlFor="payslip-payroll"
              className="text-sm leading-none font-medium"
            >
              {t.selectPayroll}
            </label>
            <Select
              value={payrollId ? String(payrollId) : ''}
              onValueChange={(v) => setPayrollId(Number(v))}
            >
              <SelectTrigger id="payslip-payroll">
                <SelectValue placeholder={t.selectPayroll} />
              </SelectTrigger>
              <SelectContent>
                {payrolls.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.employeeName} — {monthName(p.month)} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <div className="text-muted-foreground text-sm">
                {t.netSalaryLabel}{' '}
                {selected ? formatCurrency(selected.netSalary) : '—'}
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => generateMutation.mutate(payrollId)}
              disabled={!payrollId || generateMutation.isPending}
            >
              {generateMutation.isPending ? t.generating : t.generatePdf}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
