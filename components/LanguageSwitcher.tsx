'use client';

import { useLanguage } from './LanguageProvider';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`} role="group" aria-label={t('language.label')}>
      <button type="button" onClick={() => setLanguage('zh')} aria-pressed={language === 'zh'} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-1 py-1 ${language === 'zh' ? 'font-semibold underline underline-offset-4' : 'text-neutral-500'}`}>中文</button>
      <span aria-hidden="true" className="text-neutral-400">/</span>
      <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-1 py-1 ${language === 'en' ? 'font-semibold underline underline-offset-4' : 'text-neutral-500'}`}>EN</button>
    </div>
  );
}
