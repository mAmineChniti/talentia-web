'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { dict } = useI18n();
  const common = dict.common;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="bg-destructive/10 flex size-14 items-center justify-center rounded-2xl">
        <TriangleAlert className="text-destructive size-7" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">{common.errorTitle}</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        {common.errorMessage}
      </p>
      <Button onClick={retry}>{common.retry}</Button>
    </div>
  );
}
