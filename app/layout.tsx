import './globals.css';
import { Navigation } from '@/components/Navigation';
import { LanguageProvider } from '@/components/LanguageProvider';
import { SkipLink } from '@/components/SkipLink';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FORM / student creative group',
  description: 'A student group portfolio.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <LanguageProvider>
          <SkipLink />
          <Navigation />
          <div id="main-content" tabIndex={-1}>{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
