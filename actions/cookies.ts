'use server';

import { cookies } from 'next/headers';

export async function setLocale(locale: string): Promise<void> {
  const maxAge = 60 * 60 * 24 * 365;

  const cookieStore = await cookies();
  cookieStore.set('preferred-locale', locale, {
    path: '/',
    maxAge,
    sameSite: 'lax',
  });
}
