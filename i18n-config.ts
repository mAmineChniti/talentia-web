export const i18n = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'ar'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const defaultLocale = i18n.defaultLocale;
export const locales = i18n.locales;

export const isLocale = (locale: string): locale is Locale =>
  locales.includes(locale as Locale);

export const dirForLocale = (locale: Locale): 'ltr' | 'rtl' =>
  locale === 'ar' ? 'rtl' : 'ltr';
