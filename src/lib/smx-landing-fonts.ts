import { Cairo, Tajawal } from 'next/font/google';

/** Primary Arabic UI font for the SMX marketing landing. */
export const smxLandingBodyFont = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-smx-body'
});

/** Display/headline companion for SMX landing accents. */
export const smxLandingDisplayFont = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-smx-display'
});

export const smxLandingRootFontClasses = `${smxLandingBodyFont.variable} ${smxLandingDisplayFont.variable} ${smxLandingBodyFont.className}`;
