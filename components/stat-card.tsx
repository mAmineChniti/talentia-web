import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon,
  hint,
  accent = 'primary',
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-chart-2/10 text-chart-2',
    warning: 'bg-chart-3/10 text-chart-3',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-chart-1/10 text-chart-1',
  };

  return (
    <Card className={cn('py-0 rounded-lg', className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-muted-foreground truncate text-sm">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && (
            <p className="text-muted-foreground truncate text-xs">{hint}</p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              accentClasses[accent]
            )}
          >
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
