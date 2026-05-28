'use client';

import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { getCurrencyFlags } from '@/lib/currency-flags';
import { IconStar, IconX } from '@tabler/icons-react';
import { useMarketsWebSocket } from '@/contexts/markets-websocket-context';
import { getLotSize } from '@/lib/calculator-client';
import type { Market } from '@/lib/prisma/generated/client';
import type { MarketType } from '@/lib/prisma/generated/client';
import { useTradeBalanceSelection } from '@/hooks/use-trade-balance-selection';

export type AdvancedOrderMarket =
  | (Market & { lastPrice: number })
  | { symbol: string; lastPrice: number; spread?: number; type?: MarketType }
  | null;

interface TradingRoomAdvancedOrderPanelProps {
  market: AdvancedOrderMarket;
  onClose: () => void;
  onMarketOrder?: (
    type: 'BUY' | 'SELL',
    quantity: number,
    price?: number,
    takeProfit?: number,
    stopLoss?: number
  ) => Promise<void> | void;
  disabled?: boolean;
}

const formatPrice = (p: number) => {
  const s = p >= 1 ? p.toFixed(5) : p.toFixed(3);
  return s.replace(/\.?0+$/, '');
};

const formatUsd = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const getPointSize = (marketType: MarketType) =>
  marketType === 'FOREX' ? 0.00001 : 0.01;

export function TradingRoomAdvancedOrderPanel({
  market,
  onClose,
  onMarketOrder,
  disabled = false
}: TradingRoomAdvancedOrderPanelProps) {
  const { selectedBalanceType } = useTradeBalanceSelection();
  const [orderTab, setOrderTab] = useState<'market' | 'pending'>('market');
  const [volume, setVolume] = useState('0.01');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState(false);
  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [financial, setFinancial] = useState<{
    freeMargin: number;
    requiredMargin?: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedRef = useRef(false);

  const { realTimePrices, isConnected, subscribe } = useMarketsWebSocket();

  const midPrice =
    Number(
      market?.symbol && isConnected
        ? realTimePrices.get(market.symbol)?.price ?? market?.lastPrice
        : market?.lastPrice ?? 0
    ) || 0;
  const spread =
    Number((market && 'spread' in market && market.spread) ?? 0.00002) ||
    0.00002;
  const bid = midPrice - spread / 2;
  const ask = midPrice + spread / 2;
  const displayPrice = price || String(midPrice);
  const marketType: MarketType =
    (market && 'type' in market ? market.type : undefined) ?? 'FOREX';
  const lotSizeMultiplier = getLotSize(marketType);
  const leverage = 100;
  const vol = parseFloat(volume) || 0.01;
  const execPrice = parseFloat(displayPrice) || midPrice;
  const requiredMargin = (vol * lotSizeMultiplier * execPrice) / leverage;
  const spreadUsd = spread * vol * lotSizeMultiplier;

  useEffect(() => {
    if (market?.symbol && isConnected) {
      subscribe([market.symbol]);
    }
  }, [market?.symbol, isConnected, subscribe]);

  useEffect(() => {
    if (market && !initializedRef.current) {
      setVolume('0.01');
      setPrice(String(midPrice));
      initializedRef.current = true;
    }
  }, [market, midPrice]);

  useEffect(() => {
    fetch(`/api/user/financial?room=TRADING&balanceType=${selectedBalanceType}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setFinancial({ freeMargin: data.freeMargin ?? 0 });
      })
      .catch(() => setFinancial({ freeMargin: 0 }));
  }, [selectedBalanceType]);

  const notionalUsd = Math.round(vol * lotSizeMultiplier * execPrice);
  const [flagBase, flagQuote] = getCurrencyFlags(market?.symbol ?? '');

  const handleVolumeChange = (delta: number) => {
    const n = parseFloat(volume) || 0;
    const next = Math.max(0.01, Math.min(100, n + delta));
    setVolume(next.toFixed(2));
  };

  const handlePriceChange = (delta: number) => {
    const step = midPrice >= 1 ? 0.00001 : 0.00001;
    const n = parseFloat(displayPrice) || midPrice;
    setPrice((n + delta * step).toFixed(5).replace(/\.?0+$/, ''));
  };

  const pointSize = getPointSize(marketType);

  const handleSlTpPriceChange = (
    delta: number,
    current: string,
    setter: (v: string) => void,
    refPrice: number
  ) => {
    const n = parseFloat(current) || refPrice;
    const next = n + delta * pointSize;
    setter(next.toFixed(5).replace(/\.?0+$/, ''));
  };

  const prevStopLossRef = useRef(false);
  useEffect(() => {
    if (!stopLoss) {
      setStopLossPrice('');
      prevStopLossRef.current = false;
      return;
    }
    if (!prevStopLossRef.current) {
      setStopLossPrice((midPrice - 5 * pointSize).toFixed(5));
    }
    prevStopLossRef.current = true;
  }, [stopLoss, midPrice, pointSize]);

  const prevTakeProfitRef = useRef(false);
  useEffect(() => {
    if (!takeProfit) {
      setTakeProfitPrice('');
      prevTakeProfitRef.current = false;
      return;
    }
    if (!prevTakeProfitRef.current) {
      setTakeProfitPrice((midPrice + 5 * pointSize).toFixed(5));
    }
    prevTakeProfitRef.current = true;
  }, [takeProfit, midPrice, pointSize]);

  const slPriceVal = parseFloat(stopLossPrice) || midPrice;
  const tpPriceVal = parseFloat(takeProfitPrice) || midPrice;
  const slPoints = Math.round((slPriceVal - midPrice) / pointSize);
  const tpPoints = Math.round((tpPriceVal - midPrice) / pointSize);
  const slUsd = (slPriceVal - ask) * vol * lotSizeMultiplier;
  const tpUsd = (tpPriceVal - ask) * vol * lotSizeMultiplier;
  const slPct = midPrice ? ((slPriceVal - midPrice) / midPrice) * 100 : 0;
  const tpPct = midPrice ? ((tpPriceVal - midPrice) / midPrice) * 100 : 0;
  const controlsDisabled = disabled || isSubmitting;

  const submitOrder = async (
    type: 'BUY' | 'SELL',
    quantity: number,
    submitPrice?: number
  ) => {
    if (controlsDisabled) return;
    const takeProfitValue = parseFloat(takeProfitPrice);
    const stopLossValue = parseFloat(stopLossPrice);
    const normalizedTakeProfit =
      takeProfit && Number.isFinite(takeProfitValue)
        ? takeProfitValue
        : undefined;
    const normalizedStopLoss =
      stopLoss && Number.isFinite(stopLossValue) ? stopLossValue : undefined;
    try {
      setIsSubmitting(true);
      await onMarketOrder?.(
        type,
        quantity,
        submitPrice,
        normalizedTakeProfit,
        normalizedStopLoss
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!market) return null;

  return (
    <div className="flex h-full min-w-0 flex-col border-r border-[var(--trade-border)] bg-[var(--trade-panel)] text-[var(--trade-text)]">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between border-b border-[var(--trade-border)] p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            <span className="flex size-8 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[10px] font-bold">
              {flagBase}
            </span>
            {flagQuote && (
              <span className="flex size-8 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[8px]">
                {flagQuote}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold">{market.symbol}</h3>
            <p className="text-[10px] text-[var(--trade-text-muted)]">FOREX</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]"
            aria-label="Favorite"
          >
            <IconStar className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]"
            aria-label="Close"
          >
            <IconX className="size-4" />
          </button>
        </div>
      </div>

      {/* Market / Pending tabs */}
      <div className="flex shrink-0 border-b border-[var(--trade-border)]">
        <button
          type="button"
          onClick={() => setOrderTab('market')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            orderTab === 'market'
              ? 'border-b-2 border-[var(--trade-accent-blue)] bg-[var(--trade-dark)]/30 text-[var(--trade-text)]'
              : 'text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]'
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderTab('pending')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            orderTab === 'pending'
              ? 'border-b-2 border-[var(--trade-accent-blue)] bg-[var(--trade-dark)]/30 text-[var(--trade-text)]'
              : 'text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Volume */}
          <div>
            <div className="mb-2">
              <span className="text-xs font-medium">Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVolumeChange(-0.01)}
                disabled={disabled}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
              >
                −
              </button>
              <input
                type="text"
                inputMode="decimal"
                value={volume}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setVolume(v);
                }}
                onBlur={() => {
                  const n = parseFloat(volume);
                  if (Number.isNaN(n) || n < 0.01) setVolume('0.01');
                  else if (n > 100) setVolume('100');
                  else setVolume(n.toFixed(2));
                }}
                className="flex-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-center text-sm font-bold text-[var(--trade-text)] outline-none focus:ring-1 focus:ring-[var(--trade-accent-blue)]"
              />
              <button
                type="button"
                onClick={() => handleVolumeChange(0.01)}
                disabled={disabled}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
              >
                +
              </button>
            </div>
            <p className="mt-1 text-[10px] text-[var(--trade-text-muted)]">
              ≈ {notionalUsd.toLocaleString('en-US')} USD
            </p>
          </div>

          {/* Price (Pending only) */}
          {orderTab === 'pending' && (
            <div>
              <span className="mb-2 block text-xs font-medium">Price</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePriceChange(-1)}
                  disabled={disabled}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayPrice}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-center text-sm font-mono font-bold text-[var(--trade-text)] outline-none focus:ring-1 focus:ring-[var(--trade-accent-blue)]"
                />
                <button
                  type="button"
                  onClick={() => handlePriceChange(1)}
                  disabled={disabled}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text-muted)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Stop Loss / Take Profit */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded border border-[var(--trade-border)]/50 bg-[var(--trade-dark)]/30 px-3 py-2">
                <span className="text-[10px] font-medium">Stop Loss</span>
                <Switch
                  checked={stopLoss}
                  onCheckedChange={setStopLoss}
                  className="data-[state=checked]:bg-[var(--trade-accent-blue)]"
                />
              </div>
              {stopLoss && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSlTpPriceChange(
                          -1,
                          stopLossPrice,
                          setStopLossPrice,
                          midPrice
                        )
                      }
                      disabled={disabled}
                      className="flex size-8 shrink-0 items-center justify-center rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-accent-blue)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="flex-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-center text-sm font-mono font-bold text-[var(--trade-text)] outline-none focus:ring-1 focus:ring-[var(--trade-accent-blue)]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSlTpPriceChange(
                          1,
                          stopLossPrice,
                          setStopLossPrice,
                          midPrice
                        )
                      }
                      disabled={disabled}
                      className="flex size-8 shrink-0 items-center justify-center rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-accent-blue)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="flex items-center gap-1.5 text-[10px] text-[var(--trade-text-muted)]">
                    <span
                      className={
                        slUsd >= 0
                          ? 'text-[var(--trade-green)]'
                          : 'text-[var(--trade-red)]'
                      }
                    >
                      {slUsd >= 0 ? '▲' : '▼'}
                    </span>
                    <span
                      className={
                        slUsd >= 0
                          ? 'text-[var(--trade-green)]'
                          : 'text-[var(--trade-red)]'
                      }
                    >
                      {slUsd >= 0 ? '+' : ''}
                      {formatUsd(slUsd)} USD
                    </span>
                    <span>
                      {slPct >= 0 ? '+' : ''}
                      {slPct.toFixed(2)}%
                    </span>
                    <span>
                      {slPoints >= 0 ? '+' : ''}
                      {slPoints} Points
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded border border-[var(--trade-border)]/50 bg-[var(--trade-dark)]/30 px-3 py-2">
                <span className="text-[10px] font-medium">Take Profit</span>
                <Switch
                  checked={takeProfit}
                  onCheckedChange={setTakeProfit}
                  className="data-[state=checked]:bg-[var(--trade-accent-blue)]"
                />
              </div>
              {takeProfit && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSlTpPriceChange(
                          -1,
                          takeProfitPrice,
                          setTakeProfitPrice,
                          midPrice
                        )
                      }
                      disabled={disabled}
                      className="flex size-8 shrink-0 items-center justify-center rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-accent-blue)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={takeProfitPrice}
                      onChange={(e) => setTakeProfitPrice(e.target.value)}
                      className="flex-1 rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-center text-sm font-mono font-bold text-[var(--trade-text)] outline-none focus:ring-1 focus:ring-[var(--trade-accent-blue)]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSlTpPriceChange(
                          1,
                          takeProfitPrice,
                          setTakeProfitPrice,
                          midPrice
                        )
                      }
                      disabled={disabled}
                      className="flex size-8 shrink-0 items-center justify-center rounded border border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-accent-blue)] hover:bg-[var(--trade-dark)]/80 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <p className="flex items-center gap-1.5 text-[10px] text-[var(--trade-text-muted)]">
                    <span
                      className={
                        tpUsd >= 0
                          ? 'text-[var(--trade-green)]'
                          : 'text-[var(--trade-red)]'
                      }
                    >
                      {tpUsd >= 0 ? '▲' : '▼'}
                    </span>
                    <span
                      className={
                        tpUsd >= 0
                          ? 'text-[var(--trade-green)]'
                          : 'text-[var(--trade-red)]'
                      }
                    >
                      {tpUsd >= 0 ? '+' : ''}
                      {formatUsd(tpUsd)} USD
                    </span>
                    <span>
                      {tpPct >= 0 ? '+' : ''}
                      {tpPct.toFixed(2)}%
                    </span>
                    <span>
                      {tpPoints >= 0 ? '+' : ''}
                      {tpPoints} Points
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Financial summary */}
          <div className="space-y-1.5 rounded border border-[var(--trade-border)]/30 bg-[var(--trade-dark)]/20 p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--trade-text-muted)]">
                Required margin:
              </span>
              <span className="font-mono">{formatUsd(requiredMargin)} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--trade-text-muted)]">
                Free funds:
              </span>
              <span className="font-mono">
                {financial ? formatUsd(financial.freeMargin) : '—'} USD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--trade-text-muted)]">Spread:</span>
              <span className="font-mono">{formatUsd(spreadUsd)} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--trade-text-muted)]">Commission:</span>
              <span className="font-mono">0.00 USD</span>
            </div>
          </div>

          {/* Order buttons */}
          <div className="grid min-w-0 grid-cols-2 gap-2">
            {orderTab === 'market' ? (
              <>
                <Button
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => void submitOrder('SELL', vol)}
                  className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-[var(--trade-red)]/90 py-3 text-white hover:bg-[var(--trade-red)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-90">
                      <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Executing...
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase opacity-80">
                        Sell
                      </span>
                      <span className="block w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-center text-xs font-bold">
                        {formatPrice(bid)}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => void submitOrder('BUY', vol)}
                  className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-[var(--trade-green)]/90 py-3 text-white hover:bg-[var(--trade-green)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-90">
                      <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Executing...
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase opacity-80">
                        Buy
                      </span>
                      <span className="block w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-center text-xs font-bold">
                        {formatPrice(ask)}
                      </span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() =>
                    void submitOrder('SELL', vol, parseFloat(displayPrice))
                  }
                  className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-[var(--trade-red)]/90 py-3 text-white hover:bg-[var(--trade-red)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-90">
                      <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Executing...
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase opacity-80">
                        Sell Stop
                      </span>
                      <span className="block w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-center text-xs font-bold">
                        {formatPrice(parseFloat(displayPrice) || bid)}
                      </span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() =>
                    void submitOrder('BUY', vol, parseFloat(displayPrice))
                  }
                  className="flex min-w-0 flex-col items-center justify-center rounded-lg bg-[var(--trade-green)]/90 py-3 text-white hover:bg-[var(--trade-green)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-90">
                      <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Executing...
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase opacity-80">
                        Buy Limit
                      </span>
                      <span className="block w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-1 text-center text-xs font-bold">
                        {formatPrice(parseFloat(displayPrice) || ask)}
                      </span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
