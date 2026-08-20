'use client';

import { Sparkles } from 'lucide-react';

import { useI18n } from '@/components/i18n-provider';

export function AppFooter() {
  const { dict } = useI18n();
  const f = dict.landing.footer;
  const now = new Date();

  return (
    <footer className="border-t px-4 py-4 sm:px-6">
      <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="from-primary to-brand-2 flex size-5 items-center justify-center rounded-md bg-linear-to-br">
            <Sparkles className="text-primary-foreground size-3" />
          </div>
          <span className="text-foreground font-medium">TalentIA</span>
          <span className="hidden sm:inline">© {now.getFullYear()}</span>
          <span className="hidden sm:inline">{f.rights}</span>
        </div>
        <nav className="flex items-center gap-5">
          <span>{f.privacy}</span>
          <span>{f.terms}</span>
        </nav>
      </div>
    </footer>
  );
}
