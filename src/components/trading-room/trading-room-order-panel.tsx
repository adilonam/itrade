'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Market } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';

interface TradingRoomOrderPanelProps {
  market: Market | null;
  onMarketOrder?: (type: 'BUY' | 'SELL', quantity: number) => void;
  disabled?: boolean;
}

export function TradingRoomOrderPanel({
  market,
  onMarketOrder,
  disabled = false
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
  const formatCompact = (p: number) => (p >= 1 ? p.toFixed(2) : p.toFixed(3));
  const displayBidFull = formatFull(bid);
  const displayBidCompact = formatCompact(bid);
  const displayAskFull = formatFull(ask);
  const displayAskCompact = formatCompact(ask);

  const price = midPrice;

  const incrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize(Math.min(100, n + 0.01).toFixed(2));
  };
  const decrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize(Math.max(0.01, n - 0.01).toFixed(2));
  };

  if (!market) {
    return (
      <div className="rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-4 text-center text-sm text-[var(--trade-text-muted)]">
        Select a symbol to trade
      </div>
    );
  }

  const marginEstimate = (parseFloat(lotSize) || 0) * price * 100000 * 0.01; // rough forex margin

  return (
    <div className="space-y-4 rounded-lg border border-[var(--trade-border)]/30 bg-[var(--trade-dark)] p-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onMarketOrder?.('SELL', parseFloat(lotSize) || 0.01)}
          title={`SELL at ${displayBidFull} (bid)`}
          className="flex flex-col items-center justify-center rounded bg-[var(--trade-red)]/90 p-2 text-white transition-colors hover:bg-[var(--trade-red)] disabled:opacity-50"
        >
          <span className="text-[10px] font-bold uppercase opacity-80">Sell</span>
          <span className="text-lg font-bold">{displayBidCompact}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onMarketOrder?.('BUY', parseFloat(lotSize) || 0.01)}
          title={`BUY at ${displayAskFull} (ask)`}
          className="flex flex-col items-center justify-center rounded bg-[var(--trade-green)]/90 p-2 text-white transition-colors hover:bg-[var(--trade-green)] disabled:opacity-50"
        >
          <span className="text-[10px] font-bold uppercase opacity-80">Buy</span>
          <span className="text-lg font-bold">{displayAskCompact}</span>
        </button>
      </div>
      <div className="flex items-center justify-center gap-4 rounded border border-[var(--trade-border)]/30 bg-[var(--trade-dark)] py-1">
        <button
          type="button"
          onClick={decrementLot}
          disabled={disabled}
          className="px-2 text-[var(--trade-text-muted)] hover:text-white disabled:opacity-50"
        >
          −
        </button>
        <div className="text-center">
          <div className="text-xs font-bold">{lotSize}</div>
          <div className="text-[9px] text-[var(--trade-text-muted)]">≈ {marginEstimate.toFixed(0)} USD</div>
        </div>
        <button
          type="button"
          onClick={incrementLot}
          disabled={disabled}
          className="px-2 text-[var(--trade-text-muted)] hover:text-white disabled:opacity-50"
        >
          +
        </button>
      </div>
      <div className="flex items-center justify-between px-1 text-[10px] text-[var(--trade-text-muted)]">
        <Link href="#" className="flex items-center gap-1 hover:text-white">
          Advanced Order
        </Link>
      </div>
    </div>
  );
}
