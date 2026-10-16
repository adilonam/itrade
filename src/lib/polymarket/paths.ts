/** Shared path helpers for Polymarket (safe for server + client). */

export const POLYMARKET_BASE = '/polymarket';

/** Prefix an in-app path with `/polymarket`. External URLs pass through. */
export function polymarketHref(path: string): string {
  if (!path) return POLYMARKET_BASE;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('mailto:') ||
    path.startsWith('#')
  ) {
    return path;
  }
  if (path.startsWith(POLYMARKET_BASE)) return path;
  if (path === '/') return POLYMARKET_BASE;
  return `${POLYMARKET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const routing = {
  locales,
  defaultLocale: 'en' as const,
  localePrefix: 'never' as const
};

export function isRtlLocale(locale: string): boolean {
  return locale === 'ar';
}

export function getPathname(args: { href: string; locale?: string }): string {
  return polymarketHref(args.href);
}
