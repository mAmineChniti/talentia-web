'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// next-themes injects an inline <script> to prevent theme flicker (FOUC).
// The script runs correctly from the server-rendered HTML, but React 19 warns
// when it re-encounters the <script> during client-side re-renders. The warning
// is a false positive for this use case, so we filter it out in development.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes(
        'Encountered a script tag while rendering React component'
      )
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
