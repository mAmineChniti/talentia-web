'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { Fingerprint } from 'lucide-react';

import { useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { createScanSchema } from '@/lib/schemas/attendance';
import { attendanceApi } from '@/lib/services/attendance';
import type { Attendance } from '@/lib/types/attendance';
import { formatTime, fullName, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
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
import { toast } from '@/components/ui/toast';

const Scanner = dynamic(
  async () => {
    const mod = await import('@yudiel/react-qr-scanner');
    return mod.Scanner;
  },
  { ssr: false }
);

type ScanFormValues = z.infer<ReturnType<typeof createScanSchema>>;

export function ScanDialog({
  onScanned,
  buttonClassName,
  size = 'default',
  variant = 'default',
}: {
  onScanned?: () => void;
  buttonClassName?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
}) {
  const { dict } = useI18n();
  const t = dict.attendance;
  const [open, setOpen] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | undefined>(
    undefined
  );
  const scannedRef = React.useRef(false);

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
        const dateLabel = formatDate(data.date);
        if (data.checkOut) {
          toast.add({
            type: 'success',
            description: t.clockOutSuccess
              .split('{name}')
              .join(employeeName)
              .split('{time}')
              .join(formatTime(data.checkOut) + ' · ' + dateLabel),
          });
        } else {
          toast.add({
            type: 'success',
            description: t.clockInSuccess
              .split('{name}')
              .join(employeeName)
              .split('{time}')
              .join(formatTime(data.checkIn) + ' · ' + dateLabel),
          });
        }
        form.reset({ qrCode: '' });
        scannedRef.current = false;
        setOpen(false);
        onScanned?.();
      },
      onError: (err) => {
        toast.add({ type: 'error', description: err.message });
        scannedRef.current = false;
      },
    }
  );

  const handleScan = React.useCallback(
    (result: string) => {
      if (scannedRef.current || scanMutation.isPending) return;
      scannedRef.current = true;
      scanMutation.mutate(result);
    },
    [scanMutation]
  );

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
        scannedRef.current = false;
        setManualMode(false);
        setCameraError(undefined);
      } else {
        form.reset({ qrCode: '' });
      }
    },
    [form]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size={size}
            variant={variant}
            className={cn('cursor-pointer', buttonClassName)}
          />
        }
      >
        <Fingerprint /> {t.scanQr}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.scanDialogTitle}</DialogTitle>
          <DialogDescription>{t.scanDialogDesc}</DialogDescription>
        </DialogHeader>

        {manualMode ? (
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualMode(false)}
              >
                {t.scanDialogTitle}
              </Button>
              <Button type="submit" disabled={scanMutation.isPending}>
                {scanMutation.isPending ? t.recording : t.clockIn}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-4 py-1">
            {cameraError ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {cameraError}
              </p>
            ) : (
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes.length > 0) {
                    handleScan(detectedCodes[0].rawValue);
                  }
                }}
                onError={(error) => {
                  toast.add({ type: 'error', description: error.message });
                  setCameraError(error.message);
                  setManualMode(true);
                }}
                constraints={{ facingMode: 'environment' }}
                formats={['qr_code']}
                sound={false}
              />
            )}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualMode(true)}
              >
                {t.typeCode}
              </Button>
            </DialogFooter>
            {scanMutation.isPending && (
              <p className="text-muted-foreground text-center text-sm">
                {t.recording}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
