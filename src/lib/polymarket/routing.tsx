'use client';

import NextLink from 'next/link';
import {
  usePathname as useNextPathname,
  useRouter as useNextRouter
} from 'next/navigation';
import type { ComponentProps } from 'react';

import {
  polymarketHref,
  POLYMARKET_BASE,
  routing,
  locales,
  isRtlLocale,
  getPathname
} from '@/lib/polymarket/paths';

export {
  polymarketHref,
  POLYMARKET_BASE,
  routing,
  locales,
  isRtlLocale,
  getPathname
};
export type { Locale } from '@/lib/polymarket/paths';

export type PolymarketHrefInput =
  | string
  | { pathname: string; query?: Record<string, string> };

export function resolvePolymarketHref(href: PolymarketHrefInput): string {
  if (typeof href === 'string') {
    return polymarketHref(href);
  }
  const qs =
    href.query && Object.keys(href.query).length > 0
      ? `?${new URLSearchParams(href.query).toString()}`
      : '';
  return `${polymarketHref(href.pathname)}${qs}`;
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href: PolymarketHrefInput;
};

export function Link({ href, ...props }: LinkProps) {
  return <NextLink href={resolvePolymarketHref(href)} {...props} />;
}

export function usePathname(): string {
  const pathname = useNextPathname() || '';
  if (
    pathname === POLYMARKET_BASE ||
    pathname.startsWith(`${POLYMARKET_BASE}/`)
  ) {
    return pathname.slice(POLYMARKET_BASE.length) || '/';
  }
  return pathname;
}

export function useRouter() {
  const router = useNextRouter();
  return {
    ...router,
    push: (href: PolymarketHrefInput) =>
      router.push(resolvePolymarketHref(href)),
    replace: (href: PolymarketHrefInput) =>
      router.replace(resolvePolymarketHref(href)),
    prefetch: (href: PolymarketHrefInput) =>
      router.prefetch(resolvePolymarketHref(href))
  };
}
