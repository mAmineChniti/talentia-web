'use client';

import * as React from 'react';
import { AlertCircle, Database, RefreshCw, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title ?? states.errorTitle}</p>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs">
            {description ?? states.errorDescription}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw /> {states.retry}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function BackendOffline() {
  const { dict } = useI18n();
  const states = dict.states;

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="bg-chart-3/10 text-chart-3 flex size-12 items-center justify-center rounded-full">
          <Database className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">{states.backendOfflineTitle}</p>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs">
            {states.backendOfflineDescription}
          </p>
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          {icon ?? <SearchX className="size-6" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {title ?? dict.states.emptyTitle}
          </p>
          {description && (
            <p className="text-muted-foreground mx-auto max-w-sm text-xs">
              {description}
            </p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
