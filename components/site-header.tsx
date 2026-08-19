'use client';

import { ArrowRight, Sparkles } from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useI18n } from '@/components/i18n-provider';

export function SiteHeader() {
  const pathname = usePathname();
  const { dict, lang } = useI18n();

  const isAuthPage =
    pathname?.endsWith('/login') || pathname?.endsWith('/register');

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${lang}`} className="flex shrink-0 items-center gap-2.5">
          <div className="bg-primary text-primary-foreground shadow-primary/25 flex size-9 items-center justify-center rounded-xl shadow-md">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TalentIA</span>
        </Link>

        {!isAuthPage && (
          <nav className="text-muted-foreground hidden items-center gap-8 text-sm font-medium md:flex">
            <Link
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              {dict.landing.nav.features}
            </Link>
            <Link
              href="#modules"
              className="hover:text-foreground transition-colors"
            >
              {dict.landing.nav.modules}
            </Link>
            <Link
              href="#testimonials"
              className="hover:text-foreground transition-colors"
            >
              {dict.landing.nav.testimonials}
            </Link>
            <Link
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              {dict.landing.nav.pricing}
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
          <Button
            render={<Link href={`/${lang}/login`} />}
            nativeButton={false}
            variant="outline"
            className="hidden sm:inline-flex"
          >
            {dict.landing.nav.login}
          </Button>
          <Button
            render={<Link href={`/${lang}/register`} />}
            nativeButton={false}
          >
            {dict.landing.nav.register} <ArrowRight />
          </Button>
        </div>
      </div>
    </header>
  );
}
