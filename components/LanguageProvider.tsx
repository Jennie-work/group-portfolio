'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, translations, type Language, type LocalizedText, type TranslationKey } from '@/lib/i18n';

type Variables = Record<string, string | number>;
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, variables?: Variables) => string;
  localize: (text: LocalizedText) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const languageChangeEvent = 'form24-language-change';

function readStoredLanguage(): Language {
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage === 'en' ? 'en' : DEFAULT_LANGUAGE;
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(languageChangeEvent, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(languageChangeEvent, callback);
  };
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribeToLanguage, readStoredLanguage, () => DEFAULT_LANGUAGE);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(languageChangeEvent));
  }, []);

  const t = useCallback((key: TranslationKey, variables: Variables = {}) => {
    let text: string = translations[language][key];
    for (const [name, value] of Object.entries(variables)) text = text.replaceAll(`{${name}}`, String(value));
    return text;
  }, [language]);

  const localize = useCallback((text: LocalizedText) => text[language], [language]);
  const value = useMemo(() => ({ language, setLanguage, t, localize }), [language, setLanguage, t, localize]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
