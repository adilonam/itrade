'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { tenantNavItems } from '@/constants/data';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { UserNav } from './user-nav';
import { IconWifi, IconBell, IconWallet } from '@tabler/icons-react';

/** Active state for Room Trading nav items (aligned with room-trading-top-nav + TradingView embed route). */
function isRoomTradingNavActive(pathname: string | null, url: string): boolean {
  if (!pathname) return false;
  if (pathname === url) return true;
  if (url === '/trade' && pathname.startsWith('/trading-view-room-trading')) return true;
  if (url.startsWith('/transactions') && pathname.startsWith('/transactions')) return true;
  if (url === '/trade' && pathname.startsWith('/trade')) return true;
  if (url.startsWith('/admin') && pathname.startsWith(url)) return true;
  if (url.startsWith('/super-admin') && pathname.startsWith(url)) return true;
  if (url.length > 1 && pathname.startsWith(`${url}/`)) return true;
  return false;
}

function utcClockString() {
  const now = new Date();
  return now.toISOString().slice(11, 19);
}

export function WatchTraderHeader() {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();
  const [time, setTime] = useState(utcClockString);
  const [marginDisplay, setMarginDisplay] = useState<{
    text: string;
    nonNegative: boolean;
  } | null>(null);

  const loadFinancialMargin = useCallback(async () => {
    if (!session?.user) {
      setMarginDisplay(null);
      return;
    }
    try {
      const res = await fetch(
        '/api/user/financial?room=TRADING&balanceType=REAL'
      );
      if (!res.ok) throw new Error('fail');
      const json = await res.json();
      const free =
        typeof json.freeMargin === 'number' ? json.freeMargin : 0;
      const sign = free >= 0 ? '+' : '-';
      setMarginDisplay({
        text: `${sign}$${Math.abs(free).toFixed(2)}`,
        nonNegative: free >= 0
      });
    } catch {
      setMarginDisplay(null);
    }
  }, [session?.user]);

  useEffect(() => {
    const t = setInterval(() => setTime(utcClockString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadFinancialMargin();
    const i = setInterval(loadFinancialMargin, 60_000);
    return () => clearInterval(i);
  }, [loadFinancialMargin]);

  const userRole = (session?.user as { role?: string } | undefined)?.role as
    | 'USER'
    | 'SELLER'
    | 'ADMIN'
    | 'SUPERADMIN'
    | undefined;
  const roomNav =
    tenantNavItems['Room Trading']?.[userRole ?? 'USER'] ??
    tenantNavItems['Room Trading']?.USER ??
    [];

  return (
    <header className="grid h-11 shrink-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-3 text-[var(--trade-text)]">
      <div className="shrink-0 justify-self-start">
        <Link
          href="/trade"
          className="font-bold tracking-tight text-[var(--trade-accent-blue)]"
        >
          Watch-Trader
        </Link>
      </div>
      <nav
        className="w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth touch-pan-x py-0.5 text-[var(--trade-text-muted)] [scrollbar-width:thin] [scrollbar-color:var(--trade-border)_transparent] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--trade-border)]"
        aria-label="Trade room"
      >
        <div className="flex w-max min-w-full flex-nowrap items-center justify-center gap-1">
          {roomNav.map((item) => {
            const active = isRoomTradingNavActive(pathname, item.url);
            return (
              <Link
                key={`${item.url}-${item.title}`}
                href={item.url}
                className={cn(
                  'shrink-0 rounded px-2 py-1 text-[10px] font-medium transition-colors',
                  active
                    ? 'bg-[var(--trade-dark)] text-[var(--trade-accent-blue)]'
                    : 'hover:text-[var(--trade-text)]'
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex shrink-0 items-center justify-self-end gap-2">
        <div
          className="hidden items-center gap-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-2 py-1 font-mono text-[11px] sm:flex"
          title="Free margin (TRADING · REAL)"
        >
          <IconWallet className="size-3.5 shrink-0 text-[var(--trade-text-muted)] opacity-80" />
          {marginDisplay ? (
            <span
              className={
                marginDisplay.nonNegative
                  ? 'text-[var(--trade-green)]'
                  : 'text-red-400'
              }
            >
              {marginDisplay.text}
            </span>
          ) : (
            <span className="text-[var(--trade-text-muted)]">—</span>
          )}
        </div>
        <span className="flex items-center text-[var(--trade-green)]" title="Connected">
          <IconWifi className="size-4" />
        </span>
        <button
          type="button"
          className="rounded p-1.5 text-[var(--trade-text-muted)] hover:bg-[var(--trade-dark)] hover:text-[var(--trade-text)]"
          aria-label="Notifications"
        >
          <IconBell className="size-4" />
        </button>
        <ModeToggle />
        <UserNav />
        <time
          className="hidden font-mono text-[10px] text-[var(--trade-text-muted)] xl:block"
          dateTime={new Date().toISOString()}
        >
          {time} (UTC+0)
        </time>
      </div>
    </header>
  );
}
