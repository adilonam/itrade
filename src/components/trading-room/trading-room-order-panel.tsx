'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Market } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';

export type OrderPanelMarket = Market | { symbol: string; lastPrice: number; spread?: number } | null;

interface TradingRoomOrderPanelProps {
  market: OrderPanelMarket;
  onMarketOrder?: (type: 'BUY' | 'SELL', quantity: number) => void;
  disabled?: boolean;
  /** When false, hides the Advanced Order link (parent renders it) */
  showAdvancedOrder?: boolean;
}

export function TradingRoomOrderPanel({
  market,
  onMarketOrder,
  disabled = false,
  showAdvancedOrder = true
}: TradingRoomOrderPanelProps) {
  const [lotSize, setLotSize] = useState('0.01');
  const { realTimePrices, isConnected, subscribe } = useMarketsWebSocket();

  // Subscribe to live price for selected market
  useEffect(() => {
    if (market?.symbol && isConnected) {
      subscribe([market.symbol]);
    }
  }, [market?.symbol, isConnected, subscribe]);

  const livePrice = market?.symbol
    ? realTimePrices.get(market.symbol)?.price
    : undefined;
  const midPrice = livePrice ?? market?.lastPrice ?? 0;
  const spread = market?.spread ?? 0;
  const bid = midPrice - spread / 2;
  const ask = midPrice + spread / 2;

  const formatFull = (p: number) => (p >= 1 ? p.toFixed(5) : p.toFixed(3));
  const formatNoTrailingZeros = (p: number) =>
    formatFull(p).replace(/\.?0+$/, '');
  const displayBidFull = formatFull(bid);
  const displayAskFull = formatFull(ask);
  const displayBid = formatNoTrailingZeros(bid);
  const displayAsk = formatNoTrailingZeros(ask);

  const price = midPrice;

  const incrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize(Math.min(100, n + 0.01).toFixed(2));
  };
  const decrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize(Math.max(0.01, n - 0.01).toFixed(2));
  };

  const handleLotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setLotSize(val);
    }
  };

  const handleLotBlur = () => {
    const n = parseFloat(lotSize);
    if (Number.isNaN(n) || n < 0.01) {
      setLotSize('0.01');
    } else if (n > 100) {
      setLotSize('100');
    } else {
      setLotSize(n.toFixed(2));
    }
  };

  if (!market) {
    return (
      <div className="rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-4 text-center text-sm text-[var(--trade-text-muted)]">
        Select a symbol to trade
      </div>
    );
  }

  const notionalUsd = Math.round(
    (parseFloat(lotSize) || 0) * 100000 * price
  );
  const formatUsd = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-3">
      {/* Stitch layout: 2-col Buy/Sell grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onMarketOrder?.('SELL', parseFloat(lotSize) || 0.01)}
          title={`SELL at ${displayBidFull} (bid)`}
          className="flex min-w-0 flex-col items-center justify-center rounded bg-[var(--trade-red)]/90 p-2 text-white transition-colors hover:bg-[var(--trade-red)] disabled:opacity-50"
        >
          <span className="text-[10px] font-bold uppercase opacity-80">Sell</span>
          <span className="truncate w-full text-center text-sm font-bold">{displayBid}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onMarketOrder?.('BUY', parseFloat(lotSize) || 0.01)}
          title={`BUY at ${displayAskFull} (ask)`}
          className="flex min-w-0 flex-col items-center justify-center rounded bg-[var(--trade-green)]/90 p-2 text-white transition-colors hover:bg-[var(--trade-green)] disabled:opacity-50"
        >
          <span className="text-[10px] font-bold uppercase opacity-80">Buy</span>
          <span className="truncate w-full text-center text-sm font-bold">{displayAsk}</span>
        </button>
      </div>
      {/* Quantity row */}
      <div className="flex items-center justify-center gap-4 rounded border border-[var(--trade-border)]/30 bg-[var(--trade-dark)] py-1">
        <button
          type="button"
          onClick={decrementLot}
          disabled={disabled}
          className="px-2 text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] disabled:opacity-50"
        >
          −
        </button>
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <input
              type="text"
              inputMode="decimal"
              value={lotSize}
              onChange={handleLotChange}
              onBlur={handleLotBlur}
              disabled={disabled}
              className="w-12 bg-transparent text-center text-xs font-bold text-[var(--trade-text)] outline-none focus:ring-0 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[9px] font-medium text-[var(--trade-text-muted)]">lots</span>
          </div>
          <div className="text-[9px] text-[var(--trade-text-muted)]">
            ≈ {(parseFloat(lotSize) || 0.01) * price < 1000
              ? `${((parseFloat(lotSize) || 0.01) * price).toFixed(3)} USD`
              : `${formatUsd(notionalUsd)} USD`}
          </div>
        </div>
        <button
          type="button"
          onClick={incrementLot}
          disabled={disabled}
          className="px-2 text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] disabled:opacity-50"
        >
          +
        </button>
      </div>
      {showAdvancedOrder && (
        <div className="flex items-center justify-between px-1 text-[10px] text-[var(--trade-text-muted)]">
          <Link href="#" className="flex items-center gap-1 hover:text-[var(--trade-text)]">
            Advanced Order
          </Link>
        </div>
      )}
    </div>
  );
}
