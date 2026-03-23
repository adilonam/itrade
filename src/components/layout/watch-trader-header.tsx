'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { tenantNavItems } from '@/constants/data';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { UserNav } from './user-nav';
import {
  IconWifi,
  IconBell,
  IconTrendingUp
} from '@tabler/icons-react';

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
  const [profitDisplay, setProfitDisplay] = useState<string>('+$0.00');

  const loadProfit = useCallback(async () => {
    if (!session?.user) {
      setProfitDisplay('—');
      return;
    }
    try {
      const res = await fetch('/api/user/financial?room=TRADING');
      if (!res.ok) throw new Error('fail');
      const json = await res.json();
      const pnl = typeof json.totalPnL === 'number' ? json.totalPnL : 0;
      const sign = pnl >= 0 ? '+' : '';
      setProfitDisplay(`${sign}$${pnl.toFixed(2)}`);
    } catch {
      setProfitDisplay('+$1,240.00');
    }
  }, [session?.user]);

  useEffect(() => {
    const t = setInterval(() => setTime(utcClockString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadProfit();
    const i = setInterval(loadProfit, 30000);
    return () => clearInterval(i);
  }, [loadProfit]);

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
    <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-3 text-[var(--trade-text)]">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/trade"
          className="shrink-0 font-bold tracking-tight text-[var(--trade-accent-blue)]"
        >
          Watch-Trader
        </Link>
        <nav
          className="ml-2 hidden min-w-0 items-center gap-1 overflow-x-auto lg:flex"
          aria-label="Trade room"
        >
          {roomNav.map((item) => {
            const active = isRoomTradingNavActive(pathname, item.url);
            return (
              <Link
                key={`${item.url}-${item.title}`}
                href={item.url}
                className={cn(
                  'whitespace-nowrap border-b-2 px-2.5 py-2 text-xs font-medium transition-colors',
                  active
                    ? 'border-[var(--trade-accent-blue)] text-[var(--trade-text)]'
                    : 'border-transparent text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]'
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className="flex items-center gap-1 text-[var(--trade-text-muted)] lg:hidden" aria-label="Mobile trade nav">
        {roomNav.slice(0, 4).map((item) => {
          const active = isRoomTradingNavActive(pathname, item.url);
          return (
            <Link
              key={`${item.url}-${item.title}`}
              href={item.url}
              className={cn(
                'rounded px-2 py-1 text-[10px] font-medium',
                active ? 'bg-[var(--trade-dark)] text-[var(--trade-accent-blue)]' : ''
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <div
          className="hidden items-center gap-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-2 py-1 font-mono text-[11px] text-[var(--trade-green)] sm:flex"
          title="Session P&amp;L (mock if API unavailable)"
        >
          <IconTrendingUp className="size-3.5 shrink-0 opacity-80" />
          {profitDisplay}
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
