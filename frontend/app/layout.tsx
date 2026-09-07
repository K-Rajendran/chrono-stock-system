import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'SOUL x TIME — Where Time Finds Its Soul',
    template: '%s | SOUL x TIME',
  },
  description:
    'Premium luxury watch commerce. Discover handcrafted timepieces that transcend the ordinary. Where Time Finds Its Soul.',
  keywords: ['luxury watches', 'premium timepieces', 'soul x time', 'watch store'],
  authors: [{ name: 'SOUL x TIME' }],
  openGraph: {
    title: 'SOUL x TIME — Where Time Finds Its Soul',
    description: 'Premium luxury watch commerce platform.',
    type: 'website',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#161616',
                color: '#FAFAFA',
                border: '1px solid #1E1E1E',
                borderRadius: '8px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#B8933A', secondary: '#0A0A0A' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#0A0A0A' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
