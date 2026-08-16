'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/components/theme-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';

export function Providers({
  lang,
  dir,
  dict,
  children,
}: {
  lang: Locale;
  dir: 'ltr' | 'rtl';
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const [client] = React.useState(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
        mutations: {
          retry: 0,
        },
      },
    });
  });

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <I18nProvider lang={lang} dir={dir} dict={dict}>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
