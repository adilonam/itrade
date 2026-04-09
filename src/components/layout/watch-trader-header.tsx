'use client';

import { usePublicAppName } from '@/hooks/use-public-app-name';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { tenantNavItems } from '@/constants/data';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { UserNav } from './user-nav';
import { IconWifi, IconWallet, IconChevronDown } from '@tabler/icons-react';

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
  type BalanceType = 'REAL' | 'DEMO' | 'INSTITUTIONAL';
  type MarginDisplay = {
    text: string;
    nonNegative: boolean;
  };

  const balanceLabel: Record<BalanceType, string> = {
    REAL: 'Real',
    DEMO: 'Demo',
    INSTITUTIONAL: 'Institutional'
  };

  const appName = usePublicAppName();
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();
  const [time, setTime] = useState(utcClockString);
  const [selectedBalanceType, setSelectedBalanceType] = useState<BalanceType>('REAL');
  const [openBalanceDropdown, setOpenBalanceDropdown] = useState(false);
  const [marginByBalanceType, setMarginByBalanceType] = useState<
    Record<BalanceType, MarginDisplay | null>
  >({
    REAL: null,
    DEMO: null,
    INSTITUTIONAL: null
  });
  const balanceDropdownRef = useRef<HTMLDivElement | null>(null);

  const loadFinancialMargin = useCallback(async () => {
    if (!session?.user) {
      setMarginByBalanceType({
        REAL: null,
        DEMO: null,
        INSTITUTIONAL: null
      });
      return;
    }
    try {
      const balanceTypes: BalanceType[] = ['REAL', 'DEMO', 'INSTITUTIONAL'];
      const responses = await Promise.all(
        balanceTypes.map((balanceType) =>
          fetch(`/api/user/financial?room=TRADING&balanceType=${balanceType}`)
        )
      );
      if (responses.some((response) => !response.ok)) throw new Error('fail');

      const payloads = await Promise.all(responses.map((response) => response.json()));
      const nextMarginByBalanceType = balanceTypes.reduce<
        Record<BalanceType, MarginDisplay | null>
      >(
        (acc, balanceType, index) => {
          const free = typeof payloads[index]?.freeMargin === 'number' ? payloads[index].freeMargin : 0;
          const sign = free >= 0 ? '+' : '-';
          acc[balanceType] = {
            text: `${sign}$${Math.abs(free).toFixed(2)}`,
            nonNegative: free >= 0
          };
          return acc;
        },
        {
          REAL: null,
          DEMO: null,
          INSTITUTIONAL: null
        }
      );

      setMarginByBalanceType(nextMarginByBalanceType);
    } catch {
      setMarginByBalanceType({
        REAL: null,
        DEMO: null,
        INSTITUTIONAL: null
      });
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

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!balanceDropdownRef.current?.contains(event.target as Node)) {
        setOpenBalanceDropdown(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenBalanceDropdown(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

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
  const selectedMargin = marginByBalanceType[selectedBalanceType];

  return (
    <header className="grid h-11 shrink-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-3 text-[var(--trade-text)]">
      <div className="shrink-0 justify-self-start">
        <Link
          href="/trade"
          className="relative flex h-[22px] shrink-0 items-center"
          aria-label={appName}
        >
          <Image
            src="/images/logo-light.png"
            alt=""
            width={200}
            height={48}
            className="h-[22px] w-auto max-h-[22px] dark:hidden"
            priority
          />
          <Image
            src="/images/logo-dark.png"
            alt=""
            width={200}
            height={48}
            className="hidden h-[22px] w-auto max-h-[22px] dark:block"
            priority
          />
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
                  'shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors',
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
        <div className="relative hidden sm:block" ref={balanceDropdownRef}>
          <button
            type="button"
            className="flex items-center gap-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-2 py-1 font-mono text-[11px]"
            title={`Free margin (TRADING · ${selectedBalanceType})`}
            aria-haspopup="menu"
            aria-expanded={openBalanceDropdown}
            onClick={() => setOpenBalanceDropdown((prev) => !prev)}
          >
            <IconWallet className="size-3.5 shrink-0 text-[var(--trade-text-muted)] opacity-80" />
            <span className="text-[var(--trade-text-muted)]">
              {balanceLabel[selectedBalanceType]}:
            </span>
            {selectedMargin ? (
              <span
                className={
                  selectedMargin.nonNegative ? 'text-[var(--trade-green)]' : 'text-red-400'
                }
              >
                {selectedMargin.text}
              </span>
            ) : (
              <span className="text-[var(--trade-text-muted)]">—</span>
            )}
            <IconChevronDown
              className={cn(
                'size-3 text-[var(--trade-text-muted)] transition-transform',
                openBalanceDropdown && 'rotate-180'
              )}
            />
          </button>

          {openBalanceDropdown ? (
            <div
              className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[180px] rounded border border-[var(--trade-border)] bg-[var(--trade-panel)] p-1 shadow-lg"
              role="menu"
              aria-label="Balance type selector"
            >
              {(['REAL', 'INSTITUTIONAL', 'DEMO'] as BalanceType[]).map((balanceType) => {
                const margin = marginByBalanceType[balanceType];
                return (
                  <button
                    key={balanceType}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] hover:bg-[var(--trade-dark)]',
                      selectedBalanceType === balanceType && 'bg-[var(--trade-dark)]'
                    )}
                    role="menuitem"
                    onClick={() => {
                      setSelectedBalanceType(balanceType);
                      setOpenBalanceDropdown(false);
                    }}
                  >
                    <span className="font-mono text-[var(--trade-text)]">
                      {balanceLabel[balanceType]}
                    </span>
                    {margin ? (
                      <span
                        className={cn(
                          'font-mono',
                          margin.nonNegative ? 'text-[var(--trade-green)]' : 'text-red-400'
                        )}
                      >
                        {margin.text}
                      </span>
                    ) : (
                      <span className="font-mono text-[var(--trade-text-muted)]">—</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <span className="flex items-center text-[var(--trade-green)]" title="Connected">
          <IconWifi className="size-4" />
        </span>
        <ModeToggle />
        <UserNav variant="trade" />
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
