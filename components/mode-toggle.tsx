'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { dict } = useI18n();

  const currentTheme = resolvedTheme ?? (theme === 'dark' ? 'dark' : 'light');

  const toggleTheme = React.useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, [currentTheme, setTheme]);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={dict.common.theme}
      onClick={toggleTheme}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">{dict.common.theme}</span>
    </Button>
  );
}
