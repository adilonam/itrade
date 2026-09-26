import { EB_Garamond, Inter } from 'next/font/google';

// Defined once so next/font does not fetch Google Fonts per landing page at build time.
export const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-landing-display'
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-landing-body'
});
