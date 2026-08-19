'use client';

import { Sparkles } from 'lucide-react';

import Link from 'next/link';

import { useI18n } from '@/components/i18n-provider';

export function SiteFooter() {
  const { dict, lang } = useI18n();
  const f = dict.landing.footer;
  const now = new Date();

  return (
    <footer className="bg-muted/20 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Link href={`/${lang}`} className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl">
              <Sparkles className="size-4" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">
              TalentIA
            </span>
          </Link>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            {dict.metadata.description}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            © {now.getFullYear()} TalentIA. {f.rights}
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-display text-foreground text-xs font-semibold tracking-wide uppercase">
            {dict.landing.modules.title}
          </p>
          <ul className="space-y-2.5 text-sm">
            {dict.landing.modules.items.slice(0, 5).map((m) => (
              <li key={m.name}>
                <Link
                  href="#modules"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="font-display text-foreground text-xs font-semibold tracking-wide uppercase">
            {dict.landing.features.title}
          </p>
          <ul className="space-y-2.5 text-sm">
            {dict.landing.features.items.slice(0, 5).map((fItem) => (
              <li key={fItem.title}>
                <Link
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {fItem.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="font-display text-foreground text-xs font-semibold tracking-wide uppercase">
            {f.contact}
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                href="#privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {f.privacy}
              </Link>
            </li>
            <li>
              <Link
                href="#terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {f.terms}
              </Link>
            </li>
            <li>
              <Link
                href={`/${lang}/login`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {dict.landing.nav.login}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="text-muted-foreground/70 mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs sm:flex-row sm:px-6">
          <span>
            © {now.getFullYear()} TalentIA. {f.rights}
          </span>
          <span className="font-code text-[10px] tracking-tight">
            {dict.sidebar.version}
          </span>
        </div>
      </div>
    </footer>
  );
}
