import type { Metadata } from 'next';
import { Poppins, Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/Toaster';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Mumalieff - Premium T-Shirts & Custom Prints',
    template: '%s | Mumalieff',
  },
  description: 'Shop premium quality t-shirts and custom prints at Mumalieff. Create your own designs or choose from our collection.',
  keywords: ['t-shirts', 'custom prints', 'fashion', 'clothing', 'ecommerce'],
  authors: [{ name: 'Mumalieff' }],
  creator: 'Mumalieff',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mumalieff.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Mumalieff',
    title: 'Mumalieff - Premium T-Shirts & Custom Prints',
    description: 'Shop premium quality t-shirts and custom prints at Mumalieff.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mumalieff - Premium T-Shirts & Custom Prints',
    description: 'Shop premium quality t-shirts and custom prints at Mumalieff.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
