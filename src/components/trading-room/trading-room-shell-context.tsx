'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Market } from '@/lib/prisma/generated/client';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { toast } from 'sonner';
import type { SymbolItem } from './trading-room-markets-panel';
import type { AdvancedOrderMarket } from './trading-room-advanced-order-panel';
import type { ChartInterval } from './trading-room-chart-header';

export function getTradeRoomFromPath(pathname: string): 'TRADING' | 'INSTITUTIONAL' | 'STOCK' {
  if (pathname.startsWith('/trading-view-room-institutional')) return 'INSTITUTIONAL';
  if (pathname.startsWith('/trading-view-room-stock')) return 'STOCK';
  return 'TRADING';
}

export function getSymbolLinkBasePath(pathname: string): string {
  if (pathname.startsWith('/trading-view-room-institutional')) {
    return '/trading-view-room-institutional';
  }
  if (pathname.startsWith('/trading-view-room-stock')) {
    return '/trading-view-room-stock';
  }
  return '/trading-view-room-trading';
}

function isMarketItem(item: SymbolItem): item is Market {
  return 'room' in item && typeof (item as Market).room === 'string';
}

type TradingRoomShellContextValue = {
  symbols: SymbolItem[];
  selectedSymbolId: string | null;
  selectedMarket: Market | null;
  chartSymbol: string;
  headerLastPrice: number;
  chartInterval: ChartInterval;
  setChartInterval: (v: ChartInterval) => void;
  advancedOrderOpen: boolean;
  setAdvancedOrderOpen: (v: boolean) => void;
  handleSelectSymbol: (id: string, market: Market | null) => void;
  handleMarketOrder: (
    type: 'BUY' | 'SELL',
    quantity: number,
    limitPrice?: number
  ) => Promise<void>;
  advancedOrderMarket: AdvancedOrderMarket;
  tradeRoom: 'TRADING' | 'INSTITUTIONAL' | 'STOCK';
  noNavigation: boolean;
  symbolLinkBasePath: string;
  signedIn: boolean;
  /** Quick buy/sell in the markets list; hidden on institutional room for non-admin users */
  showMarketsOrderControls: boolean;
};

const TradingRoomShellContext = createContext<TradingRoomShellContextValue | null>(
  null
);

export function useTradingRoomShell() {
  const ctx = useContext(TradingRoomShellContext);
  if (!ctx) {
    throw new Error('useTradingRoomShell must be used within TradingRoomShellProvider');
  }
  return ctx;
}

export function TradingRoomShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const pk = searchParams.get('pk');
  const { data: session } = useSession();

  const tradeRoom = useMemo(() => getTradeRoomFromPath(pathname), [pathname]);
  const noNavigation = pathname === '/trade';
  const symbolLinkBasePath = useMemo(() => getSymbolLinkBasePath(pathname), [pathname]);

  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [advancedOrderOpen, setAdvancedOrderOpen] = useState(false);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('60');
  const signedIn = Boolean(session?.user);
  const role = session?.user?.role;
  const canPlaceInstitutionalOrders =
    role === 'ADMIN' || role === 'SUPERADMIN';
  const showMarketsOrderControls =
    tradeRoom !== 'INSTITUTIONAL' || canPlaceInstitutionalOrders;

  useEffect(() => {
    setSelectedSymbolId(null);
    setSelectedMarket(null);
    setAdvancedOrderOpen(false);
  }, [tradeRoom]);

  const selectedSymbol = symbols.find((s) => s.id === selectedSymbolId);
  const getPrice = (item: SymbolItem) =>
    isMarketItem(item) ? item.lastPrice : (item as { price: number }).price;
  const getSymbol = (item: SymbolItem) => item.symbol;

  const advancedOrderMarket = useMemo((): AdvancedOrderMarket => {
    if (selectedMarket) return selectedMarket;
    if (selectedSymbol) {
      return {
        symbol: getSymbol(selectedSymbol),
        lastPrice: getPrice(selectedSymbol),
        spread: 0.00002
      };
    }
    return null;
  }, [selectedMarket, selectedSymbol]);

  const chartSymbol = selectedMarket
    ? toTradingViewSymbol(selectedMarket)
    : selectedSymbol
      ? (selectedSymbol as { symbol: string }).symbol
      : '';

  const headerLastPrice = selectedSymbol ? getPrice(selectedSymbol) : 0;

  useEffect(() => {
    let cancelled = false;
    setSymbols([]);
    fetch(`/api/markets?room=${tradeRoom}`)
      .then(async (r) => {
        if (!r.ok) return { markets: [] as Market[] };
        return (await r.json()) as { markets?: Market[] };
      })
      .then((data) => {
        if (cancelled) return;
        setSymbols(Array.isArray(data.markets) ? data.markets : []);
      })
      .catch(() => {
        if (!cancelled) setSymbols([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tradeRoom]);

  useEffect(() => {
    if (!symbols.length) {
      setSelectedSymbolId(null);
      setSelectedMarket(null);
      return;
    }
    if (pk) {
      const m = symbols.find((s) => isMarketItem(s) && s.id === pk) as Market | undefined;
      if (m && isMarketItem(m)) {
        setSelectedSymbolId(m.id);
        setSelectedMarket(m);
      }
      return;
    }
    if (!selectedSymbolId && symbols[0]) {
      const first = symbols[0];
      setSelectedSymbolId(first.id);
      if (isMarketItem(first)) setSelectedMarket(first);
    }
  }, [pk, symbols, selectedSymbolId]);

  const handleSelectSymbol = useCallback((id: string, market: Market | null) => {
    setSelectedSymbolId(id);
    setSelectedMarket(market);
  }, []);

  const handleMarketOrder = useCallback(
    async (type: 'BUY' | 'SELL', quantity: number, limitPrice?: number) => {
      if (!session?.user?.id || !selectedMarket) {
        toast.error('Sign in and select a market to trade');
        return;
      }
      const isPending = limitPrice != null;
      try {
        const body: Record<string, unknown> = {
          type,
          status: isPending ? 'PENDING' : 'PLACED',
          room: tradeRoom,
          marketId: selectedMarket.id,
          quantity,
          description: isPending
            ? `${type} ${quantity} lots @ ${limitPrice}`
            : `${type} ${quantity} lots`
        };
        if (isPending) body.executedPrice = limitPrice;
        const res = await fetch('/api/user/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Order failed');
        }
        toast.success(
          isPending ? `${type} limit order placed` : `${type} order placed`
        );
        window.dispatchEvent(new CustomEvent('room-trading-positions-refresh'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Order failed');
      }
    },
    [session?.user?.id, selectedMarket, tradeRoom]
  );

  const value = useMemo(
    () => ({
      symbols,
      selectedSymbolId,
      selectedMarket,
      chartSymbol,
      headerLastPrice,
      chartInterval,
      setChartInterval,
      advancedOrderOpen,
      setAdvancedOrderOpen,
      handleSelectSymbol,
      handleMarketOrder,
      advancedOrderMarket,
      tradeRoom,
      noNavigation,
      symbolLinkBasePath,
      signedIn,
      showMarketsOrderControls
    }),
    [
      symbols,
      selectedSymbolId,
      selectedMarket,
      chartSymbol,
      headerLastPrice,
      chartInterval,
      advancedOrderOpen,
      handleSelectSymbol,
      handleMarketOrder,
      advancedOrderMarket,
      tradeRoom,
      noNavigation,
      symbolLinkBasePath,
      signedIn,
      showMarketsOrderControls
    ]
  );

  return (
    <TradingRoomShellContext.Provider value={value}>
      {children}
    </TradingRoomShellContext.Provider>
  );
}
