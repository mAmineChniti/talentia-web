'use server';

import { cookies } from 'next/headers';
import type { Role } from '@/lib/types/users';

export async function setLocale(locale: string): Promise<void> {
  const maxAge = 60 * 60 * 24 * 365;

  const cookieStore = await cookies();
  cookieStore.set('preferred-locale', locale, {
    path: '/',
    maxAge,
    sameSite: 'lax',
  });
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

const SESSION_COOKIE = 'session-user';
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(user), {
    path: '/',
    maxAge: ONE_YEAR,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { maxAge: 0 });
  cookieStore.set('JSESSIONID', '', { maxAge: 0 });
}

export async function getSessionCookie(): Promise<SessionUser | undefined> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return undefined;
  }
}
