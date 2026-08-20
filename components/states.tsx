'use client';

import * as React from 'react';
import { AlertCircle, Database, RefreshCw, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { dict } = useI18n();
  const states = dict.states;

  return (
    <div className="border-destructive/20 bg-destructive/5 relative overflow-hidden rounded-2xl border p-10 text-center">
      <div className="from-destructive/10 pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-linear-to-br to-transparent blur-2xl" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="bg-destructive/10 text-destructive ring-destructive/20 flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold">
            {title ?? states.errorTitle}
          </p>
          <p className="text-muted-foreground mx-auto max-w-sm text-[13px]">
            {description ?? states.errorDescription}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw /> {states.retry}
          </Button>
        )}
      </div>
    </div>
  );
}

export function BackendOffline() {
  const { dict } = useI18n();
  const states = dict.states;

  return (
    <div className="border-warning/25 bg-warning/5 relative overflow-hidden rounded-2xl border p-10 text-center">
      <div className="from-warning/15 pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-linear-to-br to-transparent blur-2xl" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="bg-warning/10 text-warning ring-warning/25 flex size-14 items-center justify-center rounded-2xl shadow-sm ring-1">
          <Database className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold">
            {states.backendOfflineTitle}
          </p>
          <p className="text-muted-foreground mx-auto max-w-sm text-[13px]">
            {states.backendOfflineDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const { dict } = useI18n();

  return (
    <div className="bg-card/60 relative overflow-hidden rounded-2xl border border-dashed p-10 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage:
            'radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage:
            'radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent)',
        }}
      />
      <div className="relative flex flex-col items-center gap-3">
        <div className="from-primary/15 to-brand-2/10 text-primary ring-primary/15 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br shadow-sm ring-1">
          {icon ?? <SearchX className="size-6" />}
        </div>
        <div className="space-y-1">
          <p className="font-heading text-sm font-semibold">
            {title ?? dict.states.emptyTitle}
          </p>
          {description && (
            <p className="text-muted-foreground mx-auto max-w-sm text-[13px]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
