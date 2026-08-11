'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

const toneMap: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
> = {
  APPROVED: 'default',
  ACCEPTED: 'default',
  PRESENT: 'default',
  DONE: 'default',
  COMPLETED: 'default',
  ACTIVE: 'default',

  PENDING: 'secondary',
  PLANNED: 'secondary',
  HR_INTERVIEW: 'secondary',
  TECHNICAL_INTERVIEW: 'secondary',
  REGISTERED: 'secondary',
  ONLINE: 'secondary',

  REJECTED: 'destructive',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  EXPIRED: 'destructive',
  ABSENT: 'destructive',
  INACTIVE: 'destructive',

  RETARD: 'outline',
  ONSITE: 'outline',
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
  const variant = toneMap[key] ?? 'secondary';

  const label = statusDict[key] ?? status;

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      <span
        className={cn(
          'me-1.5 inline-block size-1.5 rounded-full',
          variant === 'default' && 'bg-primary-foreground/80',
          variant === 'secondary' && 'bg-secondary-foreground/60',
          variant === 'destructive' && 'bg-destructive',
          variant === 'outline' && 'bg-muted-foreground',
          variant === 'ghost' && 'bg-muted-foreground'
        )}
      />
      {label}
    </Badge>
  );
}
