'use client';

import { useLanguage } from './LanguageProvider';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`} role="group" aria-label={t('language.label')}>
      <button type="button" onClick={() => setLanguage('zh')} aria-pressed={language === 'zh'} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-1 py-1 font-bold ${language === 'zh' ? 'bg-lime text-ink' : 'text-ink/50 hover:bg-white/60'}`}>中文</button>
      <span aria-hidden="true" className="text-ink/30">/</span>
      <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-1 py-1 font-bold ${language === 'en' ? 'bg-lime text-ink' : 'text-ink/50 hover:bg-white/60'}`}>EN</button>
    </div>
  );
}
