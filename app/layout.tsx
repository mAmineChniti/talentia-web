import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';

import './globals.css';

import {
  defaultLocale,
  dirForLocale,
  isLocale,
  type Locale,
} from '@/i18n-config';

import { getDictionary } from '@/get-dictionary';
import { Providers } from '@/components/providers';
import { DirectionProvider } from '@/components/ui/direction';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const localeHeader = requestHeaders.get('x-locale') ?? defaultLocale;
  const lang: Locale = isLocale(localeHeader) ? localeHeader : defaultLocale;
  const dict = await getDictionary(lang);

  return {
    title: {
      default: dict.metadata.title,
      template: '%s · TalentIA',
    },
    description: dict.metadata.description,
  };
}

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const fontHeading = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-heading',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const requestHeaders = await headers();
  const localeHeader = requestHeaders.get('x-locale') ?? defaultLocale;
  const lang: Locale = isLocale(localeHeader) ? localeHeader : defaultLocale;
  const dir = dirForLocale(lang);
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      dir={dir}
      suppressHydrationWarning
      className={cn(
        fontHeading.variable,
        fontMono.variable,
        'font-sans',
        inter.variable
      )}
    >
      <body className="bg-background text-foreground min-h-screen antialiased">
        <DirectionProvider direction={dir}>
          <Providers lang={lang} dir={dir} dict={dict}>
            {children}
          </Providers>
        </DirectionProvider>
      </body>
    </html>
  );
}
