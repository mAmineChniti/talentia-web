'use client';

import { Sparkles } from 'lucide-react';

import Link from 'next/link';

import { useI18n } from '@/components/i18n-provider';

export function SiteFooter() {
  const { dict, lang } = useI18n();
  const f = dict.landing.footer;
  const landing = dict.landing;
  const now = new Date();

  const columns = [
    {
      title: f.product,
      links: landing.modules.items.map((m) => ({
        name: m.name,
        href: `/${lang}/#modules`,
        link: true,
      })),
    },
    {
      title: f.account,
      links: [
        { name: landing.nav.login, href: `/${lang}/login`, link: true },
        { name: landing.nav.register, href: `/${lang}/register`, link: true },
        { name: landing.nav.dashboard, href: `/${lang}/dashboard`, link: true },
      ],
    },
    {
      title: f.legal,
      links: [
        { name: f.privacy, href: '#', link: false },
        { name: f.terms, href: '#', link: false },
      ],
    },
  ];

  return (
    <footer className="bg-muted/20 border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-3">
            <Link href={`/${lang}`} className="flex w-fit items-center gap-2.5">
              <div className="from-primary to-brand-2 shadow-primary/30 flex size-9 items-center justify-center rounded-xl bg-linear-to-br shadow-lg">
                <Sparkles className="text-primary-foreground size-4.5" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight">
                TalentIA
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              {dict.metadata.description}
            </p>
            <p className="text-muted-foreground/70 text-xs">
              © {now.getFullYear()} TalentIA. {f.rights}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="space-y-3.5">
              <p className="text-foreground text-xs font-semibold tracking-widest uppercase">
                {col.title}
              </p>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.name}>
                    {link.link ? (
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground/80">
                        {link.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 border-t py-6 text-xs sm:flex-row">
          <p>
            © {now.getFullYear()} TalentIA. {f.rights}
          </p>
          <div className="flex items-center gap-5">
            <span>{f.privacy}</span>
            <span>{f.terms}</span>
            <Link
              href={`/${lang}/register`}
              className="from-primary to-brand-2 text-primary-foreground rounded-full bg-linear-to-r px-3 py-1 font-medium shadow-sm"
            >
              {landing.nav.register}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
