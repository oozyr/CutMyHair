import { en } from './messages/en';
import { ms } from './messages/ms';

export const locales = ['en', 'ms'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const messages = { en, ms };
