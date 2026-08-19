'use client';

import { Check, Globe } from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/components/i18n-provider';
import { isLocale, locales, type Locale } from '@/i18n-config';
import { setLocale } from '@/actions/cookies';

const localeLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

const shortLabels: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
};

export function LanguageSwitcher() {
  const { lang, dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const handleLocaleClick = (locale: Locale) => {
    void setLocale(locale);

    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    const rest = isLocale(firstSegment) ? segments.slice(1) : segments;
    const path = rest.length > 0 ? `/${rest.join('/')}` : '';
    router.push(`/${locale}${path}`);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={dict.common.language}
            title={dict.common.language}
          />
        }
      >
        <Globe className="size-4" />
        <span className="sr-only">{shortLabels[lang]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleClick(locale)}
            disabled={locale === lang}
          >
            {locale === lang && <Check className="size-4" />}
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
