import * as React from 'react';

import { cn } from '@/lib/utils';

export function DataPanel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground ring-foreground/10 flex flex-col overflow-hidden rounded-xl ring-1',
        className
      )}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 space-y-0.5">
            {title && (
              <div className="font-display text-sm font-semibold tracking-tight">
                {title}
              </div>
            )}
            {description && (
              <p className="text-muted-foreground text-xs">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className={cn('min-w-0 flex-1', contentClassName)}>{children}</div>
    </div>
  );
}
