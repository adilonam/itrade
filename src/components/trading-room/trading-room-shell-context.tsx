'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { useSession } from 'next-auth/react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Market } from '@/lib/prisma/generated/client';
import { toTradingViewSymbol } from '@/lib/market-symbol';
import { toast } from 'sonner';
import type { SymbolItem } from './trading-room-markets-panel';
import type { AdvancedOrderMarket } from './trading-room-advanced-order-panel';
import type { ChartInterval } from './trading-room-chart-header';
import { useTradeBalanceSelection } from '@/hooks/use-trade-balance-selection';

export function getTradeRoomFromPath(pathname: string): 'TRADING' | 'STOCK' {
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

function getItemType(item: SymbolItem): Market['type'] | string {
  return isMarketItem(item) ? item.type : (item as { type: string }).type;
}

export const MOBILE_TRADING_PANEL_SIZE = 48;

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
    limitPrice?: number,
    takeProfit?: number,
    stopLoss?: number
  ) => Promise<void>;
  advancedOrderMarket: AdvancedOrderMarket;
  tradeRoom: 'TRADING' | 'STOCK';
  noNavigation: boolean;
  symbolLinkBasePath: string;
  signedIn: boolean;
  /** Quick buy/sell in the markets list; hidden on institutional room for non-admin users */
  showMarketsOrderControls: boolean;
  /** Mobile: trading palette visible (chart-only when false). */
  mobileTradingOpen: boolean;
  openMobileTrading: () => void;
  closeMobileTrading: () => void;
  onMobileTradingPanelCollapse: () => void;
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
  const { selectedBalanceType } = useTradeBalanceSelection();

  const tradeRoom = useMemo(() => getTradeRoomFromPath(pathname), [pathname]);
  const noNavigation = pathname === '/trade';
  const symbolLinkBasePath = useMemo(() => getSymbolLinkBasePath(pathname), [pathname]);

  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [advancedOrderOpen, setAdvancedOrderOpen] = useState(false);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('60');
  const [mobileTradingOpen, setMobileTradingOpen] = useState(false);
  const mobileTradingPanelRef = useRef<ImperativePanelHandle | null>(null);
  const signedIn = Boolean(session?.user);
  const showMarketsOrderControls = true;

  const openMobileTrading = useCallback(() => {
    mobileTradingPanelRef.current?.resize(MOBILE_TRADING_PANEL_SIZE);
    setMobileTradingOpen(true);
  }, []);

  const closeMobileTrading = useCallback(() => {
    const panel = mobileTradingPanelRef.current;
    if (panel && !panel.isCollapsed()) {
      panel.collapse();
    }
    setMobileTradingOpen(false);
  }, []);

  const onMobileTradingPanelCollapse = useCallback(() => {
    setMobileTradingOpen(false);
  }, []);

  useEffect(() => {
    const panel = mobileTradingPanelRef.current;
    if (panel && !panel.isCollapsed()) {
      panel.collapse();
    }
    setMobileTradingOpen(false);
  }, [pathname]);

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
    if (!selectedSymbolId && symbols.length > 0) {
      const first =
        symbols.find((s) => getItemType(s) === 'FOREX') ?? symbols[0];
      setSelectedSymbolId(first.id);
      if (isMarketItem(first)) setSelectedMarket(first);
    }
  }, [pk, symbols, selectedSymbolId]);

  const handleSelectSymbol = useCallback((id: string, market: Market | null) => {
    setSelectedSymbolId(id);
    setSelectedMarket(market);
  }, []);

  const handleMarketOrder = useCallback(
    async (
      type: 'BUY' | 'SELL',
      quantity: number,
      limitPrice?: number,
      takeProfit?: number,
      stopLoss?: number
    ) => {
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
          balanceType: selectedBalanceType,
          marketId: selectedMarket.id,
          quantity,
          description: isPending
            ? `${type} ${quantity} lots @ ${limitPrice}`
            : `${type} ${quantity} lots`
        };
        if (isPending) body.executedPrice = limitPrice;
        if (takeProfit !== undefined) body.takeProfit = takeProfit;
        if (stopLoss !== undefined) body.stopLoss = stopLoss;
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
    [session?.user?.id, selectedMarket, tradeRoom, selectedBalanceType]
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
      showMarketsOrderControls,
      mobileTradingOpen,
      openMobileTrading,
      closeMobileTrading,
      onMobileTradingPanelCollapse
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
      showMarketsOrderControls,
      mobileTradingOpen,
      openMobileTrading,
      closeMobileTrading,
      onMobileTradingPanelCollapse
    ]
  );

  return (
    <TradingRoomShellContext.Provider value={value}>
      <TradingRoomShellPanelRefBridge panelRef={mobileTradingPanelRef}>
        {children}
      </TradingRoomShellPanelRefBridge>
    </TradingRoomShellContext.Provider>
  );
}

const TradingRoomShellPanelRefContext = createContext<MutableRefObject<ImperativePanelHandle | null> | null>(
  null
);

export function useMobileTradingPanelRef() {
  const ref = useContext(TradingRoomShellPanelRefContext);
  if (!ref) {
    throw new Error('useMobileTradingPanelRef must be used within TradingRoomShellProvider');
  }
  return ref;
}

function TradingRoomShellPanelRefBridge({
  panelRef,
  children
}: {
  panelRef: MutableRefObject<ImperativePanelHandle | null>;
  children: React.ReactNode;
}) {
  return (
    <TradingRoomShellPanelRefContext.Provider value={panelRef}>
      {children}
    </TradingRoomShellPanelRefContext.Provider>
  );
}
