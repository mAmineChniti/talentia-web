// Locale-aware formatting helpers

import type { Locale } from '@/i18n-config';

const INTL_LOCALES: Record<Locale, string> = {
  fr: 'fr-TN',
  en: 'en-US',
  ar: 'ar-TN',
};

const formatState: { locale: Locale } = { locale: 'fr' };

export function setFormatLocale(locale: Locale) {
  formatState.locale = locale;
}

function intlLocale(locale: Locale) {
  return INTL_LOCALES[locale] ?? INTL_LOCALES.fr;
}

const currencyCache = new Map<Locale, Intl.NumberFormat>();
function getCurrency(locale: Locale) {
  let formatter = currencyCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale(locale), {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 2,
    });
    currencyCache.set(locale, formatter);
  }
  return formatter;
}

export function formatCurrency(
  value?: number | null,
  locale: Locale = formatState.locale
) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return getCurrency(locale).format(value);
}

const dateCache = new Map<Locale, Intl.DateTimeFormat>();
function getDate(locale: Locale) {
  let formatter = dateCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    dateCache.set(locale, formatter);
  }
  return formatter;
}

export function formatDate(
  value?: string | null,
  locale: Locale = formatState.locale
) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return getDate(locale).format(d);
}

const dateTimeCache = new Map<Locale, Intl.DateTimeFormat>();
function getDateTime(locale: Locale) {
  let formatter = dateTimeCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale(locale), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    dateTimeCache.set(locale, formatter);
  }
  return formatter;
}

export function formatDateTime(
  value?: string | null,
  locale: Locale = formatState.locale
) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return getDateTime(locale).format(d);
}

export function formatTime(value?: string | null) {
  if (!value) return '—';
  return value.slice(0, 5);
}

const numberCache = new Map<Locale, Intl.NumberFormat>();
function getNumber(locale: Locale) {
  let formatter = numberCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlLocale(locale));
    numberCache.set(locale, formatter);
  }
  return formatter;
}

export function formatNumber(
  value?: number | null,
  locale: Locale = formatState.locale
) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return getNumber(locale).format(value);
}

const relativeCache = new Map<Locale, Intl.RelativeTimeFormat>();
function getRelative(locale: Locale) {
  let formatter = relativeCache.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(intlLocale(locale), {
      numeric: 'auto',
    });
    relativeCache.set(locale, formatter);
  }
  return formatter;
}

export function relativeTime(
  value?: string | null,
  locale: Locale = formatState.locale
) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60_000);
  if (Math.abs(mins) < 1) return getRelative(locale).format(0, 'minute');
  if (Math.abs(mins) < 60) return getRelative(locale).format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return getRelative(locale).format(-hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return getRelative(locale).format(-days, 'day');
  return formatDate(value, locale);
}

const todayCache = new Map<Locale, string>();

export function formatToday(locale: Locale): string {
  let label = todayCache.get(locale);
  if (!label) {
    const now = new Date();
    label = getDate(locale).format(now);
    todayCache.set(locale, label);
  }
  return label;
}

export function initials(name?: string, lastname?: string) {
  return (
    `${(name || '')[0] || ''}${(lastname || '')[0] || ''}`.toUpperCase() || '?'
  );
}

export function fullName(name?: string, lastname?: string) {
  return [name, lastname].filter(Boolean).join(' ') || '—';
}

const monthCache = new Map<Locale, Intl.DateTimeFormat>();
function getMonth(locale: Locale) {
  let formatter = monthCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocale(locale), { month: 'long' });
    monthCache.set(locale, formatter);
  }
  return formatter;
}

export function monthName(month: number, locale: Locale = formatState.locale) {
  const index = (month - 1 + 12) % 12;
  return getMonth(locale).format(new Date(2026, index, 1));
}
