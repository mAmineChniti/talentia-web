import type { Locale } from '@/i18n-config';
import type en from '@/dictionaries/en.json';
import enDict from '@/dictionaries/en.json';
import frDict from '@/dictionaries/fr.json';
import arDict from '@/dictionaries/ar.json';

type DictionaryContent = typeof en;

const dictionaries: Record<Locale, DictionaryContent> = {
  en: enDict,
  fr: frDict,
  ar: arDict,
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale] ?? dictionaries.fr;
};

export type Dictionary = DictionaryContent;
