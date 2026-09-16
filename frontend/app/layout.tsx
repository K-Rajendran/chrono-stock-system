import type { Metadata } from 'next';
// @ts-ignore -- CSS side-effect imports are handled by Next.js at build time.
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AFINO — Where Time Finds Its Soul',
    template: '%s | AFINO',
  },
  description: 'Premium luxury timepieces — where craftsmanship meets artistry. Discover our exclusive collection of fine watches.',
  keywords: ['luxury watches', 'premium timepieces', 'fine watches', 'AFINO'],
  openGraph: {
    type: 'website',
    siteName: 'AFINO',
    title: 'AFINO — Premium Luxury Watches',
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
