import en from './messages/en.json';
import ms from './messages/ms.json';

export const locales = ['en', 'ms'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const messages: Record<Locale, typeof en> = { en, ms };

let currentLocale: Locale = defaultLocale;

export function setLocale(locale: Locale) {
  if (locales.includes(locale)) {
    currentLocale = locale;
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, locale?: Locale): string {
  const activeLocale = locale || currentLocale;
  const dict = messages[activeLocale] || messages[defaultLocale];
  const parts = key.split('.');

  let curr: any = dict;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return key;
    }
  }

  return typeof curr === 'string' ? curr : key;
}
