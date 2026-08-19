'use client';

import { ArrowRight, FileQuestion } from 'lucide-react';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export default function NotFound() {
  const { dict, lang } = useI18n();
  const t = dict.notFound;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="from-primary/15 ring-primary/20 via-chart-2/10 flex size-20 items-center justify-center rounded-3xl bg-linear-to-tr to-transparent ring-1">
        <FileQuestion className="text-primary size-10" />
      </div>
      <div className="space-y-2">
        <p className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-6xl font-extrabold tracking-tight text-transparent">
          404
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm">
          {t.message}
        </p>
      </div>
      <Button render={<Link href={`/${lang}`} />} nativeButton={false}>
        {dict.common.backHome}
        <ArrowRight className="size-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
