import type * as React from 'react';

import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  icon,
  kicker,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  kicker?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {icon && (
          <div className="from-primary to-brand-2 text-primary-foreground shadow-primary/20 relative hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br shadow-md sm:flex">
            <div className="bg-primary-foreground/25 absolute -top-3 -right-3 size-8 rounded-full blur-lg" />
            {icon}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          {kicker && (
            <p className="text-primary text-[11px] font-semibold tracking-widest uppercase">
              {kicker}
            </p>
          )}
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-[1.7rem]">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
