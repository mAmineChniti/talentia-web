'use client';

import { Sparkles } from 'lucide-react';

import Link from 'next/link';

import { useI18n } from '@/components/i18n-provider';

export function AppFooter() {
  const { dict } = useI18n();
  const f = dict.landing.footer;
  const version = dict.sidebar.version;
  const now = new Date();

  return (
    <footer className="border-t px-4 py-4 sm:px-6">
      <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-md">
            <Sparkles className="size-3" />
          </div>
          <span className="text-foreground font-medium">TalentIA</span>
          <span className="hidden sm:inline">© {now.getFullYear()}</span>
          <span className="hidden sm:inline">{f.rights}</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link
            href="#privacy"
            className="hover:text-foreground transition-colors"
          >
            {f.privacy}
          </Link>
          <Link
            href="#terms"
            className="hover:text-foreground transition-colors"
          >
            {f.terms}
          </Link>
          <Link
            href="#contact"
            className="hover:text-foreground transition-colors"
          >
            {f.contact}
          </Link>
          <span className="font-code hidden text-[10px] tracking-tight sm:inline">
            {version}
          </span>
        </nav>
      </div>
    </footer>
  );
}
