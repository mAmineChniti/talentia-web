// Formatting helpers (French locale)

const LOCALE = 'fr-TN';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'TND',
  maximumFractionDigits: 2,
});

export function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return currencyFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateFormatter.format(d);
}

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateTimeFormatter.format(d);
}

export function formatTime(value?: string | null) {
  if (!value) return '—';
  return value.slice(0, 5);
}

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return numberFormatter.format(value);
}

export function relativeTime(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatDate(value);
}

export function initials(name?: string, lastname?: string) {
  return (
    `${(name || '')[0] || ''}${(lastname || '')[0] || ''}`.toUpperCase() || '?'
  );
}

export function fullName(name?: string, lastname?: string) {
  return [name, lastname].filter(Boolean).join(' ') || 'Inconnu';
}

const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long' });

export function monthName(month: number) {
  const index = (month - 1 + 12) % 12;
  return monthFormatter.format(new Date(2026, index, 1));
}

export const leaveTypeLabel: Record<string, string> = {
  ANNUAL: 'Congé annuel',
  SICK: 'Congé maladie',
  MATERNITY: 'Maternité',
  PATERNITY: 'Paternité',
  UNPAID: 'Sans solde',
  EXCEPTIONAL: 'Exceptionnel',
};

export const postTypeLabel: Record<string, string> = {
  PUBLICITE: 'Annonce',
  POSTE_TRAVAIL: "Offre d'emploi",
  FORMATION: 'Formation',
};
