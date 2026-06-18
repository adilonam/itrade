'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { Market } from '@/lib/prisma/generated/client';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import {
  formatTradePrice,
  formatTradePriceFull,
  getTradePriceButtonTextClass
} from '@/lib/trade-price-format';

export type OrderPanelMarket = Market | { symbol: string; lastPrice: number; spread?: number } | null;

interface TradingRoomOrderPanelProps {
  market: OrderPanelMarket;
  onMarketOrder?: (
    type: 'BUY' | 'SELL',
    quantity: number
  ) => Promise<void> | void;
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
  const t = useTranslations('Trade.order');
  const [lotSize, setLotSize] = useState('0.01');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const displayBidFull = formatTradePriceFull(bid);
  const displayAskFull = formatTradePriceFull(ask);
  const displayBid = formatTradePrice(bid);
  const displayAsk = formatTradePrice(ask);
  const bidPriceClass = getTradePriceButtonTextClass(displayBid);
  const askPriceClass = getTradePriceButtonTextClass(displayAsk);

  const price = midPrice;

  const incrementLot = () => {
    const n = parseFloat(lotSize) || 0;
    setLotSize((n + 0.01).toFixed(2));
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
    } else {
      setLotSize(n.toFixed(2));
    }
  };

  if (!market) {
    return (
      <div className="rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-4 text-center text-sm text-[var(--trade-text-muted)]">
        {t('selectSymbol')}
      </div>
    );
  }

  const notionalUsd = Math.round(
    (parseFloat(lotSize) || 0) * 100000 * price
  );
  const formatUsd = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const controlsDisabled = disabled || isSubmitting;

  const handleSubmitOrder = async (type: 'BUY' | 'SELL') => {
    if (controlsDisabled) return;
    try {
      setIsSubmitting(true);
      await onMarketOrder?.(type, parseFloat(lotSize) || 0.01);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 max-md:space-y-1.5 md:space-y-3">
      <div className="grid grid-cols-1 gap-1.5 max-md:gap-1.5 md:grid-cols-2 md:gap-2">
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => void handleSubmitOrder('SELL')}
          title={t('sellTitle', { price: displayBidFull })}
          className="flex min-w-0 flex-col items-center justify-center rounded bg-[var(--trade-red)]/90 p-1.5 text-white transition-colors hover:bg-[var(--trade-red)] disabled:opacity-50 max-md:py-1.5 md:p-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase opacity-90 max-md:text-[9px] md:text-[10px]">
              <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {t('executing')}
            </span>
          ) : (
            <>
              <span className="text-[9px] font-bold uppercase opacity-80 max-md:text-[9px] md:text-[10px]">
                {t('sell')}
              </span>
              <span
                className={`w-full px-0.5 text-center font-mono font-bold leading-tight tabular-nums ${bidPriceClass}`}
              >
                {displayBid}
              </span>
            </>
          )}
        </button>
        <button
          type="button"
          disabled={controlsDisabled}
          onClick={() => void handleSubmitOrder('BUY')}
          title={t('buyTitle', { price: displayAskFull })}
          className="flex min-w-0 flex-col items-center justify-center rounded bg-[var(--trade-green)]/90 p-1.5 text-white transition-colors hover:bg-[var(--trade-green)] disabled:opacity-50 max-md:py-1.5 md:p-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase opacity-90 max-md:text-[9px] md:text-[10px]">
              <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {t('executing')}
            </span>
          ) : (
            <>
              <span className="text-[9px] font-bold uppercase opacity-80 max-md:text-[9px] md:text-[10px]">
                {t('buy')}
              </span>
              <span
                className={`w-full px-0.5 text-center font-mono font-bold leading-tight tabular-nums ${askPriceClass}`}
              >
                {displayAsk}
              </span>
            </>
          )}
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 rounded border border-[var(--trade-border)]/30 bg-[var(--trade-dark)] py-0.5 max-md:gap-2 max-md:py-0.5 md:gap-4 md:py-1">
        <button
          type="button"
          onClick={decrementLot}
          disabled={controlsDisabled}
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
              disabled={controlsDisabled}
              className="w-12 bg-transparent text-center text-xs font-bold text-[var(--trade-text)] outline-none focus:ring-0 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-[9px] font-medium text-[var(--trade-text-muted)]">{t('lots')}</span>
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
          disabled={controlsDisabled}
          className="px-2 text-[var(--trade-text-muted)] hover:text-[var(--trade-text)] disabled:opacity-50"
        >
          +
        </button>
      </div>
      {showAdvancedOrder && (
        <div className="flex items-center justify-between px-1 text-[10px] text-[var(--trade-text-muted)]">
          <Link href="#" className="flex items-center gap-1 hover:text-[var(--trade-text)]">
            {t('advancedOrder')}
          </Link>
        </div>
      )}
    </div>
  );
}
