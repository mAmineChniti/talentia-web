'use client';

import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

type Tone = 'success' | 'pending' | 'danger' | 'neutral';

const toneMap: Record<string, Tone> = {
  APPROVED: 'success',
  ACCEPTED: 'success',
  PRESENT: 'success',
  DONE: 'success',
  COMPLETED: 'success',
  ACTIVE: 'success',

  PENDING: 'pending',
  PLANNED: 'pending',
  HR_INTERVIEW: 'pending',
  TECHNICAL_INTERVIEW: 'pending',
  REGISTERED: 'pending',
  ONLINE: 'pending',

  REJECTED: 'danger',
  CANCELLED: 'danger',
  FAILED: 'danger',
  EXPIRED: 'danger',
  ABSENT: 'danger',
  INACTIVE: 'danger',

  RETARD: 'neutral',
  ONSITE: 'neutral',
};

const toneClasses: Record<Tone, string> = {
  success: 'bg-chart-2/10 text-chart-2 ring-chart-2/25 [&>span]:bg-chart-2',
  pending: 'bg-chart-3/10 text-chart-3 ring-chart-3/25 [&>span]:bg-chart-3',
  danger:
    'bg-destructive/10 text-destructive ring-destructive/25 [&>span]:bg-destructive',
  neutral: 'bg-info/10 text-info ring-info/25 [&>span]:bg-info',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { dict } = useI18n();
  const statusDict = dict.status as Record<string, string>;

  const key = (status || '').toUpperCase();
  const tone = toneMap[key] ?? 'neutral';
  const label = statusDict[key] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        toneClasses[tone],
        className
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          tone === 'pending' && 'animate-pulse'
        )}
      />
      {label}
    </span>
  );
}
