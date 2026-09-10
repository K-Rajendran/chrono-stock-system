import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SOUL x TIME — Where Time Finds Its Soul',
    template: '%s | SOUL x TIME',
  },
  description: 'Premium luxury timepieces — where craftsmanship meets artistry. Discover our exclusive collection of fine watches.',
  keywords: ['luxury watches', 'premium timepieces', 'fine watches', 'SOUL x TIME'],
  openGraph: {
    type: 'website',
    siteName: 'SOUL x TIME',
    title: 'SOUL x TIME — Premium Luxury Watches',
    description: 'Where time finds its soul. Discover our exclusive collection.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
