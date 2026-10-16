import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google';

/** Serif display font — close substitute for EB Garamond. */
export const landingDisplayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-landing-display'
});

/** Sans body font — close substitute for Inter. */
export const landingBodyFont = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-landing-body'
});

export const landingRootFontClasses = `${landingDisplayFont.variable} ${landingBodyFont.className}`;
export const landingDisplayFontClassName = landingDisplayFont.className;
