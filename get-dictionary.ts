import type { Locale } from '@/i18n-config';
import type en from '@/dictionaries/en.json';

type DictionaryContent = typeof en;

const dictionaries: Record<Locale, () => Promise<DictionaryContent>> = {
  fr: async () => {
    const dict = await import('@/dictionaries/fr.json');
    return dict.default;
  },
  en: async () => {
    const dict = await import('@/dictionaries/en.json');
    return dict.default;
  },
  ar: async () => {
    const dict = await import('@/dictionaries/ar.json');
    return dict.default;
  },
};

export const getDictionary = async (locale: Locale) =>
  dictionaries[locale]?.() ?? dictionaries.fr();

export type Dictionary = DictionaryContent;
