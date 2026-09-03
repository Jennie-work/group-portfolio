import './globals.css';
import { Navigation } from '@/components/Navigation';
import { LanguageProvider } from '@/components/LanguageProvider';
import { SkipLink } from '@/components/SkipLink';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bcqns2group14.asia'),
  title: 'POLARIS YOUTH · Group 14 Portfolio',
  description: '北辰青年暑期线上实习二期 Group 14 作品集。',
  openGraph: {
    title: 'POLARIS YOUTH · Group 14 Portfolio',
    description: '北辰青年暑期线上实习二期 Group 14 作品集。',
    images: ['/assets/polaris-elements/scattered-page-cream-headphones.png'],
  },
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
