'use client';

import { usePublicAppName } from '@/hooks/use-public-app-name';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { tenantNavItems } from '@/constants/data';
import { LanguageMenu } from '@/components/i18n/language-menu';
import { tradeNavTitleKey } from '@/lib/trade-nav-i18n';
import { ModeToggle } from '@/components/layout/ThemeToggle/theme-toggle';
import { useTranslations } from 'next-intl';
import { UserNav } from './user-nav';
import { IconWifi, IconWallet, IconChevronDown } from '@tabler/icons-react';
import { useTradeBalanceSelection } from '@/hooks/use-trade-balance-selection';
import {
  TRADE_BALANCE_TYPES,
  type TradeBalanceType
} from '@/lib/balance-selection';

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

type BalanceAmountDisplay = {
  text: string;
  nonNegative: boolean;
};

const emptyBalanceByType = (): Record<TradeBalanceType, BalanceAmountDisplay | null> => ({
  REAL: null,
  DEMO: null
});

export function WatchTraderHeader() {
  const t = useTranslations('Trade.header');
  const tNav = useTranslations('Trade.nav');

  const balanceLabel: Record<TradeBalanceType, string> = {
    REAL: t('balanceReal'),
    DEMO: t('balanceDemo')
  };

  const appName = usePublicAppName();
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();
  const { selectedBalanceType, setTradeBalanceType } = useTradeBalanceSelection();
  const [time, setTime] = useState(utcClockString);
  const [openBalanceDropdown, setOpenBalanceDropdown] = useState(false);
  const [balanceByBalanceType, setBalanceByBalanceType] = useState<
    Record<TradeBalanceType, BalanceAmountDisplay | null>
  >(emptyBalanceByType);
  const balanceDropdownRef = useRef<HTMLDivElement | null>(null);

  const loadFinancialBalance = useCallback(async () => {
    if (!session?.user) {
      setBalanceByBalanceType(emptyBalanceByType());
      return;
    }
    try {
      const responses = await Promise.all(
        TRADE_BALANCE_TYPES.map((balanceType) =>
          fetch(`/api/user/financial?room=TRADING&balanceType=${balanceType}`)
        )
      );
      if (responses.some((response) => !response.ok)) throw new Error('fail');

      const payloads = await Promise.all(responses.map((response) => response.json()));
      const nextBalanceByType = TRADE_BALANCE_TYPES.reduce<
        Record<TradeBalanceType, BalanceAmountDisplay | null>
      >(
        (acc, balanceType, index) => {
          const equity =
            typeof payloads[index]?.equity === 'number' ? payloads[index].equity : 0;
          const sign = equity >= 0 ? '+' : '-';
          acc[balanceType] = {
            text: `${sign}$${Math.abs(equity).toFixed(2)}`,
            nonNegative: equity >= 0
          };
          return acc;
        },
        emptyBalanceByType()
      );

      setBalanceByBalanceType(nextBalanceByType);
    } catch {
      setBalanceByBalanceType(emptyBalanceByType());
    }
  }, [session?.user]);

  useEffect(() => {
    const t = setInterval(() => setTime(utcClockString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadFinancialBalance();
    const i = setInterval(loadFinancialBalance, 50_000);
    return () => clearInterval(i);
  },
   [loadFinancialBalance]);

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
  const selectedBalanceAmount = balanceByBalanceType[selectedBalanceType];

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
        aria-label={t('tradeRoom')}
      >
        <div className="flex w-max min-w-full flex-nowrap items-center justify-center gap-1">
          {roomNav.map((item) => {
            const active = isRoomTradingNavActive(pathname, item.url);
            const navKey = tradeNavTitleKey(item.title);
            const navLabel = navKey ? tNav(navKey) : item.title;
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
                {navLabel}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex shrink-0 items-center justify-self-end gap-2">
        <div className="relative" ref={balanceDropdownRef}>
          <button
            type="button"
            className="flex max-w-[5.5rem] items-center gap-0.5 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-1.5 py-0.5 font-mono text-[10px] sm:max-w-none sm:gap-1 sm:px-2 sm:py-1 sm:text-[11px]"
            title={t('balanceTitle', { type: selectedBalanceType })}
            aria-haspopup="menu"
            aria-expanded={openBalanceDropdown}
            aria-label={t('balanceTypeSelector')}
            onClick={() => setOpenBalanceDropdown((prev) => !prev)}
          >
            <IconWallet className="size-3 shrink-0 text-[var(--trade-text-muted)] opacity-80 sm:size-3.5" />
            <span className="truncate text-[var(--trade-text)] sm:text-[var(--trade-text-muted)]">
              <span className="sm:hidden">{balanceLabel[selectedBalanceType]}</span>
              <span className="hidden sm:inline">
                {balanceLabel[selectedBalanceType]}:
              </span>
            </span>
            {selectedBalanceAmount ? (
              <span
                className={cn(
                  'hidden sm:inline',
                  selectedBalanceAmount.nonNegative
                    ? 'text-[var(--trade-green)]'
                    : 'text-red-400'
                )}
              >
                {selectedBalanceAmount.text}
              </span>
            ) : (
              <span className="hidden text-[var(--trade-text-muted)] sm:inline">
                —
              </span>
            )}
            <IconChevronDown
              className={cn(
                'size-2.5 shrink-0 text-[var(--trade-text-muted)] transition-transform sm:size-3',
                openBalanceDropdown && 'rotate-180'
              )}
            />
          </button>

          {openBalanceDropdown ? (
            <div
              className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[180px] rounded border border-[var(--trade-border)] bg-[var(--trade-panel)] p-1 shadow-lg"
              role="menu"
              aria-label={t('balanceTypeSelector')}
            >
              {TRADE_BALANCE_TYPES.map((balanceType) => {
                const rowBalance = balanceByBalanceType[balanceType];
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
                      void setTradeBalanceType(balanceType);
                      setOpenBalanceDropdown(false);
                    }}
                  >
                    <span className="font-mono text-[var(--trade-text)]">
                      {balanceLabel[balanceType]}
                    </span>
                    {rowBalance ? (
                      <span
                        className={cn(
                          'font-mono',
                          rowBalance.nonNegative ? 'text-[var(--trade-green)]' : 'text-red-400'
                        )}
                      >
                        {rowBalance.text}
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
        <span className="flex items-center text-[var(--trade-green)]" title={t('connected')}>
          <IconWifi className="size-4" />
        </span>
        <LanguageMenu variant="trade" />
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
