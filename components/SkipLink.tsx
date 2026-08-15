'use client';

import { useLanguage } from './LanguageProvider';

export function SkipLink() {
  const { t } = useLanguage();

  return (
    <a href="#main-content" className="skip-link">
      {t('accessibility.skipToContent')}
    </a>
  );
}
