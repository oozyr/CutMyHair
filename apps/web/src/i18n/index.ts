import en from './messages/en.json';
import ms from './messages/ms.json';

export const locales = ['en', 'ms'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const messages = { en, ms };
