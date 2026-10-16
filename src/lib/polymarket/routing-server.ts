import { redirect as nextRedirect } from 'next/navigation';

import { polymarketHref, routing, locales, isRtlLocale, getPathname } from '@/lib/polymarket/paths';

export { polymarketHref, routing, locales, isRtlLocale, getPathname };
export type { Locale } from '@/lib/polymarket/paths';

/** Server redirect into the polymarket section. */
export function redirect(
  args: string | { href: string; locale?: string }
): never {
  const href = typeof args === 'string' ? args : args.href;
  nextRedirect(polymarketHref(href));
}
