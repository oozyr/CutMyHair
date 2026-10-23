import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import en from './messages/en.json';
import ms from './messages/ms.json';

export const locales = ['en', 'ms'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

const STORAGE_KEY = '@cutmyhair_locale';

export const messages: Record<Locale, typeof en> = { en, ms };

function detectDeviceLocale(): Locale {
  try {
    const deviceLocales = Localization.getLocales();
    const primary = deviceLocales[0]?.languageCode?.toLowerCase();
    if (primary === 'ms' || primary === 'bm') {
      return 'ms';
    }
  } catch {
    // fallback
  }
  return 'en';
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (newLocale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: async () => {},
  t: (key: string) => key,
  isReady: false,
});

export function translate(
  key: string,
  locale: Locale,
  params?: Record<string, string | number>,
): string {
  const dict = messages[locale] || messages[defaultLocale];
  const parts = key.split('.');

  let curr: any = dict;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return key;
    }
  }

  let text = typeof curr === 'string' ? curr : key;
  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      text = text.split(`{{${paramKey}}}`).join(String(paramVal));
    }
  }
  return text;
}

// Fallback standalone t function using detected or default locale
let currentStandaloneLocale: Locale = defaultLocale;

export function t(
  key: string,
  params?: Record<string, string | number>,
  locale?: Locale,
): string {
  return translate(key, locale || currentStandaloneLocale, params);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadLocale() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'ms') {
          setLocaleState(saved);
          currentStandaloneLocale = saved;
        } else {
          const detected = detectDeviceLocale();
          setLocaleState(detected);
          currentStandaloneLocale = detected;
        }
      } catch {
        const detected = detectDeviceLocale();
        setLocaleState(detected);
        currentStandaloneLocale = detected;
      } finally {
        setIsReady(true);
      }
    }
    loadLocale();
  }, []);

  const changeLocale = async (newLocale: Locale) => {
    if (newLocale !== 'en' && newLocale !== 'ms') return;
    setLocaleState(newLocale);
    currentStandaloneLocale = newLocale;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // storage error ignored
    }
  };

  const tHook = (key: string, params?: Record<string, string | number>) =>
    translate(key, locale, params);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale: changeLocale,
        t: tHook,
        isReady,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
