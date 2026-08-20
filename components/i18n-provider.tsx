'use client';

import * as React from 'react';

import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';
import { setFormatLocale } from '@/lib/format';

type I18nContextValue = {
  lang: Locale;
  dir: 'ltr' | 'rtl';
  dict: Dictionary;
};

const I18nContext = React.createContext<I18nContextValue | undefined>(
  undefined
);

export function I18nProvider({
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
  React.useEffect(() => {
    setFormatLocale(lang);
  }, [lang]);

  const value = React.useMemo(() => ({ lang, dir, dict }), [lang, dir, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }
  return ctx;
}
