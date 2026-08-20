import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n, type Locale } from '@/i18n-config';
import { match as matchLocale } from '@formatjs/intl-localematcher';

import Negotiator from 'negotiator';

const SESSION_COOKIE = 'JSESSIONID';
const LANG_COOKIE = 'preferred-locale';
const USER_COOKIE = 'session-user';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/employees',
  '/attendance',
  '/leaves',
  '/contracts',
  '/payroll',
  '/payslips',
  '/trainings',
  '/recruitment',
];

const ROUTE_ROLES: Record<string, string[]> = {
  dashboard: ['USER', 'HR', 'ADMIN'],
  employees: ['HR', 'ADMIN'],
  attendance: ['HR', 'ADMIN'],
  leaves: ['USER', 'HR', 'ADMIN'],
  contracts: ['HR', 'ADMIN'],
  payroll: ['ADMIN'],
  payslips: ['ADMIN'],
  trainings: ['USER', 'HR', 'ADMIN'],
  recruitment: ['HR', 'ADMIN'],
};

function getLocale(request: NextRequest): Locale {
  const negotiatorHeaders: Record<string, string> = {};
  for (const [key, value] of request.headers.entries())
    negotiatorHeaders[key] = value;
  const locales = [...i18n.locales];
  const negotiator = new Negotiator({ headers: negotiatorHeaders });
  const languages = negotiator.languages(locales);
  return matchLocale(languages, locales, i18n.defaultLocale) as Locale;
}

function isProtectedPath(pathname: string, locale: Locale): boolean {
  const relative =
    pathname === `/${locale}`
      ? '/'
      : pathname.startsWith(`/${locale}/`)
        ? pathname.slice(`/${locale}`.length)
        : pathname;
  return PROTECTED_PREFIXES.some(
    (prefix) => relative === prefix || relative.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  const userCookie = request.cookies.get(USER_COOKIE);

  const pathname = request.nextUrl.pathname;

  // Skip internal paths
  /* eslint-disable unicorn/prefer-simple-condition-first */
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/backend-api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }
  /* eslint-enable unicorn/prefer-simple-condition-first */

  const pathSegment = pathname.split('/').find(Boolean);
  const firstSegment = pathSegment;
  const ValidLocale =
    firstSegment && i18n.locales.includes(firstSegment as Locale);
  const locale = (
    ValidLocale ? firstSegment : getLocale(request) || i18n.defaultLocale
  ) as Locale;

  // Redirect locale-less paths (e.g. "/", "/login") to a locale-prefixed route.
  if (!ValidLocale) {
    const cookieLocale = request.cookies.get(LANG_COOKIE)?.value;

    const preferredLocale =
      typeof cookieLocale === 'string' &&
      i18n.locales.includes(cookieLocale as Locale)
        ? cookieLocale
        : i18n.defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  if ((!session || !userCookie) && isProtectedPath(pathname, locale)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.search = '';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    const raw = request.cookies.get(USER_COOKIE)?.value;
    let role: string | undefined;
    if (raw) {
      try {
        role = (JSON.parse(raw) as { role: string }).role;
      } catch {
        // invalid cookie, ignore
      }
    }
    const relative =
      pathname === `/${locale}`
        ? '/'
        : pathname.startsWith(`/${locale}/`)
          ? pathname.slice(`/${locale}`.length)
          : pathname;
    const segment = relative.split('/').find(Boolean);
    const allowed = segment ? ROUTE_ROLES[segment] : undefined;

    if (allowed && role && !allowed.includes(role)) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(dashUrl);
    }
  }

  // If URL has locale, update cookie preference to match
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.cookies.set(LANG_COOKIE, locale, {
    path: '/',
    maxAge: 31_536_000, // 1 year
  });
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|backend-api|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
