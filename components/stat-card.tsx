import * as React from 'react';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info';

const accentStyles: Record<
  Accent,
  { tile: string; bar: string; chip: string }
> = {
  primary: {
    tile: 'from-primary/15 to-primary/5 text-primary ring-primary/15',
    bar: 'via-primary/50',
    chip: 'bg-primary/10 text-primary',
  },
  success: {
    tile: 'from-chart-2/15 to-chart-2/5 text-chart-2 ring-chart-2/15',
    bar: 'via-chart-2/50',
    chip: 'bg-chart-2/10 text-chart-2',
  },
  warning: {
    tile: 'from-chart-3/20 to-chart-3/5 text-chart-3 ring-chart-3/20',
    bar: 'via-chart-3/50',
    chip: 'bg-chart-3/10 text-chart-3',
  },
  danger: {
    tile: 'from-destructive/15 to-destructive/5 text-destructive ring-destructive/15',
    bar: 'via-destructive/50',
    chip: 'bg-destructive/10 text-destructive',
  },
  info: {
    tile: 'from-chart-4/20 to-chart-4/5 text-chart-4 ring-chart-4/20',
    bar: 'via-chart-4/50',
    chip: 'bg-chart-4/10 text-chart-4',
  },
};

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  trendPositive,
  accent = 'primary',
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  accent?: Accent;
  className?: string;
}) {
  const tone = accentStyles[accent];

  return (
    <div
      className={cn(
        'bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div
        className={cn(
          'from-primary/5 pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-linear-to-br to-transparent opacity-70 blur-2xl'
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-muted-foreground truncate text-[13px] font-medium">
            {label}
          </p>
          <p className="font-heading text-[1.7rem] leading-tight font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {(hint || trend) && (
            <div className="flex min-h-5 flex-wrap items-center gap-1.5">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    tone.chip
                  )}
                >
                  {trendPositive ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {trend}
                </span>
              )}
              {hint && (
                <span className="text-muted-foreground truncate text-xs">
                  {hint}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-sm ring-1 ring-inset',
              tone.tile
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={cn(
          'absolute inset-x-6 bottom-0 h-px bg-linear-to-r from-transparent to-transparent',
          tone.bar
        )}
      />
    </div>
  );
}
