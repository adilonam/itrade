'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  IconWallet,
  IconTrendingUp,
  IconChevronDown,
  IconCash,
  IconChartBar,
  IconList,
  IconClock,
  IconArrowUp,
  IconArrowDown,
  IconAdjustments,
  IconPencil
} from '@tabler/icons-react';
import { BinaryOptionsChart, EXPIRATION_OPTIONS } from './binary-options-chart';

const PROFIT_PERCENTAGE = 0.85;

type PositionDirection = 'call' | 'put';

interface OpenPosition {
  id: string;
  asset: string;
  direction: PositionDirection;
  strikePrice: number;
  currentPrice: number;
  investment: number;
  expiresAt: number;
  placedAt: number; // Unix seconds for chart marker
  profit: number | null;
}

function formatTimeLeft(expiresAt: number): string {
  const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}s` : `${s}s`;
}

/**
 * Binary Options Trading Platform — from Stitch
 * Project: 8552035941910974308 | Screen: fc0312b3fb5c4d928e36a2cbdce294d4
 * Uses Stitch palette via arbitrary Tailwind values.
 */
type TradeResult = 'WIN' | 'LOW' | 'HIGH';

export function BinaryOptionsTradingScreen() {
  const [investment, setInvestment] = useState(50);
  const [expirationSeconds, setExpirationSeconds] = useState(60);
  const [livePrice, setLivePrice] = useState(1.0842);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [lastResult, setLastResult] = useState<TradeResult | null>(null);
  const [, setTick] = useState(0);
  const livePriceRef = useRef(livePrice);

  useEffect(() => {
    livePriceRef.current = livePrice;
  }, [livePrice]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const potentialProfit = Math.round(investment * PROFIT_PERCENTAGE * 100) / 100;
  const hasActiveOrder = openPositions.some((p) => p.profit === null);

  const placeTrade = useCallback(
    (direction: PositionDirection) => {
      setLastResult(null);
      const expiresAt = Date.now() + expirationSeconds * 1000;
      const profitAmount = Math.round(investment * PROFIT_PERCENTAGE * 100) / 100;
      const placedAt = Math.floor(Date.now() / 1000);
      const strikePrice = livePrice;
      const position: OpenPosition = {
        id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        asset: 'EUR/USD',
        direction,
        strikePrice,
        currentPrice: strikePrice,
        investment,
        expiresAt,
        placedAt,
        profit: null
      };
      setOpenPositions((prev) => [...prev, position]);

      setTimeout(() => {
        const priceAtExpiry = livePriceRef.current;
        const isWin =
          direction === 'call'
            ? priceAtExpiry > strikePrice
            : priceAtExpiry < strikePrice;
        const resultProfit = isWin ? profitAmount : -investment;

        if (direction === 'call') {
          setLastResult(isWin ? 'WIN' : 'LOW');
        } else {
          setLastResult(isWin ? 'WIN' : 'HIGH');
        }

        setOpenPositions((prev) =>
          prev.map((p) =>
            p.id === position.id ? { ...p, profit: resultProfit } : p
          )
        );
      }, expirationSeconds * 1000);
    },
    [livePrice, expirationSeconds, investment]
  );

  return (
    <div className='flex flex-col min-h-[600px] rounded-xl border border-[#383829]'>
      {/* Top bar */}
      <header className='flex items-center justify-between rounded-t-xl border-b border-[#383829] px-6 py-3 bg-[#171711] sticky top-0 z-50'>
        <div className='flex items-center gap-8'>
          <div className='flex items-center gap-2 text-[#c8c81e]'>
            <IconWallet className='h-8 w-8' />
            <h1 className='text-xl font-bold tracking-tight'>BinaryTrade</h1>
          </div>
          <nav className='hidden md:flex items-center gap-6'>
            <button
              type='button'
              className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#c8c81e]/10 border border-[#c8c81e]/40 text-[#c8c81e] hover:bg-[#c8c81e]/20 transition-colors'
            >
              <span className='text-sm font-semibold'>EUR/USD</span>
              <IconChevronDown className='h-4 w-4' />
            </button>
            <div className='flex gap-2'>
              <Link
                href='#'
                className='px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/10 transition-colors'
              >
                GBP/JPY
              </Link>
              <Link
                href='#'
                className='px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/10 transition-colors'
              >
                BTC/USDT
              </Link>
              <Link
                href='#'
                className='px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/10 transition-colors'
              >
                ETH/USD
              </Link>
            </div>
          </nav>
        </div>
        <div className='flex items-center gap-6'>
          <Link
            href='/deposit'
            className='bg-[#c8c81e] text-[#171711] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#d4d42a] hover:shadow-lg hover:shadow-[#c8c81e]/30 transition-all'
          >
            DEPOSIT
          </Link>
          <div className='h-10 w-10 rounded-full border-2 border-[#c8c81e]/20 bg-[#26261c] overflow-hidden'>
            <div className='w-full h-full bg-[#383829] flex items-center justify-center text-slate-500'>
              <IconWallet className='h-5 w-5' />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className='flex flex-1 overflow-x-auto overflow-y-visible min-h-0'>
        {/* Chart section */}
        <section className='flex-[7] flex flex-col p-4 gap-4 min-w-0'>
          <div className='flex items-center justify-between px-2'>
            <div className='flex items-center gap-4'>
              <h2 className='text-2xl font-bold'>EUR/USD</h2>
              <div className='flex items-center gap-2 px-2 py-0.5 rounded bg-[#0bda24]/10 text-[#0bda24]'>
                <IconTrendingUp className='h-4 w-4' />
                <span className='text-sm font-bold'>{livePrice.toFixed(5)}</span>
                <span className='text-xs font-medium'>+0.02%</span>
              </div>
            </div>
            <div className='flex items-center gap-2 bg-[#26261c] p-1 rounded-lg border border-[#383829]'>
              <button
                type='button'
                className='px-3 py-1 rounded bg-[#c8c81e]/20 text-[#c8c81e] text-xs font-bold border border-[#c8c81e]/40'
              >
                1M
              </button>
              <button
                type='button'
                className='px-3 py-1 rounded text-xs font-bold text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/10 transition-colors'
              >
                5M
              </button>
              <button
                type='button'
                className='px-3 py-1 rounded text-xs font-bold text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/10 transition-colors'
              >
                15M
              </button>
              <button
                type='button'
                className='px-3 py-1 rounded text-xs font-bold text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/10 transition-colors'
              >
                1H
              </button>
              <div className='w-px h-4 bg-[#383829] mx-1' />
              <button type='button' className='text-slate-500 hover:text-[#c8c81e] p-1 rounded transition-colors'>
                <IconAdjustments className='h-5 w-5' />
              </button>
              <button type='button' className='text-slate-500 hover:text-[#c8c81e] p-1 rounded transition-colors'>
                <IconPencil className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Chart area */}
          <div className='h-[450px] shrink-0 bg-[#26261c] rounded-xl border border-[#383829] relative overflow-hidden'>
            <BinaryOptionsChart
              expirationSeconds={expirationSeconds}
              height={450}
              className='rounded-xl'
              orders={openPositions.filter((p) => p.profit === null)}
              onCurrentPriceChange={setLivePrice}
            />
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-4 min-h-[128px]'>
            <div className='bg-[#26261c] rounded-xl border border-[#383829] p-4 flex flex-col gap-3'>
              <div className='flex items-center gap-2 text-slate-500'>
                <IconCash className='h-5 w-5 shrink-0' />
                <span className='text-xs font-semibold uppercase tracking-wider'>
                  Total Profit
                </span>
              </div>
              <div className='flex items-baseline gap-2 flex-wrap'>
                <span className='text-2xl font-bold text-[#0bda24]'>
                  +$2,481.50
                </span>
                <span className='text-sm font-medium text-[#0bda24]'>
                  +12%
                </span>
              </div>
            </div>
            <div className='bg-[#26261c] rounded-xl border border-[#383829] p-4 flex flex-col gap-3'>
              <div className='flex items-center gap-2 text-slate-500'>
                <IconChartBar className='h-5 w-5 shrink-0' />
                <span className='text-xs font-semibold uppercase tracking-wider'>
                  Win Rate
                </span>
              </div>
              <div className='flex items-center gap-2 min-w-0'>
                <span className='text-2xl font-bold shrink-0'>68.4%</span>
                <div className='flex-1 h-1.5 bg-[#171711] rounded-full overflow-hidden min-w-[60px]'>
                  <div
                    className='bg-[#c8c81e] h-full rounded-full'
                    style={{ width: '68.4%' }}
                  />
                </div>
              </div>
            </div>
            <div className='bg-[#26261c] rounded-xl border border-[#383829] p-4 flex flex-col gap-3'>
              <div className='flex items-center gap-2 text-slate-500'>
                <IconList className='h-5 w-5 shrink-0' />
                <span className='text-xs font-semibold uppercase tracking-wider'>
                  Total Trades
                </span>
              </div>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-bold'>142</span>
                <span className='text-xs font-medium text-slate-500'>
                  This Month
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className='flex-[3] border-l border-[#383829] flex flex-col bg-[#26261c]/50 p-6 gap-6 overflow-y-auto min-w-[280px]'>
          <div className='flex flex-col gap-6'>
            <h3 className='text-lg font-bold'>Trading Controls</h3>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-slate-400'>
                  Investment Amount
                </label>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold'>
                    $
                  </span>
                  <input
                    type='number'
                    min={1}
                    max={10000}
                    value={investment}
                    onChange={(e) => setInvestment(Math.max(1, Number(e.target.value) || 1))}
                    className='w-full bg-[#26261c] border border-[#383829] focus:border-[#c8c81e] focus:ring-1 focus:ring-[#c8c81e] rounded-xl h-14 pl-10 pr-24 font-bold text-lg'
                  />
                  <div className='absolute right-2 top-1/2 -translate-y-1/2 flex gap-1'>
                    <button
                      type='button'
                      onClick={() => setInvestment(1)}
                      className='bg-[#171711] hover:bg-[#c8c81e]/20 hover:text-[#c8c81e] hover:border-[#c8c81e]/40 border border-transparent p-1.5 rounded-lg transition-colors text-xs font-bold w-10'
                    >
                      MIN
                    </button>
                    <button
                      type='button'
                      onClick={() => setInvestment(1000)}
                      className='bg-[#171711] hover:bg-[#c8c81e]/20 hover:text-[#c8c81e] hover:border-[#c8c81e]/40 border border-transparent p-1.5 rounded-lg transition-colors text-xs font-bold w-10'
                    >
                      MAX
                    </button>
                  </div>
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-slate-400'>
                  Expiration Time
                </label>
                <div className='relative'>
                  <select
                    value={expirationSeconds}
                    onChange={(e) => setExpirationSeconds(Number(e.target.value))}
                    className='w-full bg-[#26261c] border border-[#383829] focus:border-[#c8c81e] focus:ring-1 focus:ring-[#c8c81e] rounded-xl h-14 px-4 pr-10 font-bold text-lg appearance-none cursor-pointer'
                  >
                    {EXPIRATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <IconClock className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 h-5 w-5' />
                </div>
              </div>
              {hasActiveOrder && (() => {
                const activePos = openPositions.find((p) => p.profit === null);
                if (!activePos) return null;
                return (
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-medium text-slate-400'>
                      Time left
                    </label>
                    <div className='w-full bg-[#c8c81e]/10 border border-[#c8c81e]/40 rounded-xl h-14 px-4 flex items-center justify-center font-bold text-xl text-[#c8c81e] tabular-nums'>
                      {formatTimeLeft(activePos.expiresAt)}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className='bg-[#c8c81e]/10 border border-[#c8c81e]/20 rounded-xl p-4 flex justify-between items-center'>
              <span className='text-sm font-medium text-[#c8c81e]'>
                Potential Profit ({Math.round(PROFIT_PERCENTAGE * 100)}%)
              </span>
              <span className='text-xl font-bold text-[#c8c81e]'>+${potentialProfit.toFixed(2)}</span>
            </div>
            <div className='flex flex-col gap-4'>
              {lastResult !== null && (
                <div
                  className={`rounded-xl border-2 px-4 py-3 text-center text-xl font-black uppercase tracking-widest ${
                    lastResult === 'WIN'
                      ? 'border-[#0bda24] bg-[#0bda24]/20 text-[#0bda24]'
                      : 'border-[#ef4444] bg-[#ef4444]/20 text-[#ef4444]'
                  }`}
                >
                  {lastResult}
                </div>
              )}
              <button
                type='button'
                disabled={hasActiveOrder}
                onClick={() => placeTrade('call')}
                className='flex flex-col items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white h-24 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/25 border-2 border-emerald-400/50 group disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'
              >
                <IconArrowUp className='h-8 w-8 font-bold group-hover:-translate-y-0.5 transition-transform' />
                <span className='text-lg font-black uppercase tracking-widest'>
                  CALL
                </span>
                <span className='text-xs font-medium opacity-90'>Buy / Up</span>
              </button>
              <button
                type='button'
                disabled={hasActiveOrder}
                onClick={() => placeTrade('put')}
                className='flex flex-col items-center justify-center gap-1 bg-rose-500 hover:bg-rose-400 text-white h-24 rounded-xl transition-all active:scale-95 shadow-lg shadow-rose-500/25 border-2 border-rose-400/50 group disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'
              >
                <IconArrowDown className='h-8 w-8 font-bold group-hover:translate-y-0.5 transition-transform' />
                <span className='text-lg font-black uppercase tracking-widest'>
                  PUT
                </span>
                <span className='text-xs font-medium opacity-90'>Sell / Down</span>
              </button>
            </div>
          </div>
          <div className='mt-4 flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-bold uppercase text-slate-500 tracking-wider'>
                Live Feed
              </h4>
              <span className='h-2 w-2 rounded-full bg-[#0bda24] animate-pulse' />
            </div>
            <div className='space-y-3'>
              <div className='flex items-center justify-between p-3 rounded-lg bg-[#26261c] border-l-4 border-[#0bda24]'>
                <div>
                  <p className='text-xs font-bold'>User #8421</p>
                  <p className='text-[10px] text-slate-500'>
                    EUR/USD • 1m
                  </p>
                </div>
                <p className='text-[#0bda24] font-bold text-sm'>+$185.00</p>
              </div>
              <div className='flex items-center justify-between p-3 rounded-lg bg-[#26261c] border-l-4 border-[#ef4444]'>
                <div>
                  <p className='text-xs font-bold'>User #3391</p>
                  <p className='text-[10px] text-slate-500'>
                    BTC/USDT • 5m
                  </p>
                </div>
                <p className='text-[#ef4444] font-bold text-sm'>-$50.00</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer table */}
      <footer className='h-64 bg-[#171711] border-t border-[#383829] flex flex-col overflow-hidden'>
        <div className='flex border-b border-[#383829] px-6'>
          <button
            type='button'
            className='px-6 py-4 text-sm font-bold border-b-2 border-[#c8c81e] text-[#c8c81e] bg-[#c8c81e]/5'
          >
            Open Positions ({openPositions.length})
          </button>
          <button
            type='button'
            className='px-6 py-4 text-sm font-bold text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/5 transition-colors'
          >
            Closed Trades
          </button>
          <button
            type='button'
            className='px-6 py-4 text-sm font-bold text-slate-500 hover:text-[#c8c81e] hover:bg-[#c8c81e]/5 transition-colors'
          >
            Pending Orders
          </button>
        </div>
        <div className='flex-1 overflow-y-auto px-6'>
          <table className='w-full text-left'>
            <thead className='sticky top-0 bg-[#171711] text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
              <tr>
                <th className='py-4'>Asset</th>
                <th className='py-4'>Time Left</th>
                <th className='py-4'>Strike Price</th>
                <th className='py-4'>Current Price</th>
                <th className='py-4'>Investment</th>
                <th className='py-4 text-right'>Profit</th>
              </tr>
            </thead>
            <tbody className='text-sm'>
              {openPositions.length === 0 ? (
                <tr>
                  <td colSpan={6} className='py-12 text-center text-slate-500'>
                    No open positions. Place a trade using CALL or PUT above.
                  </td>
                </tr>
              ) : (
                openPositions.map((pos) => (
                  <tr
                    key={pos.id}
                    className='border-b border-[#383829]/50 hover:bg-[#26261c]/30 transition-colors'
                  >
                    <td className='py-4'>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            pos.direction === 'call' ? 'bg-[#0bda24]' : 'bg-[#ef4444]'
                          }`}
                        >
                          {pos.direction === 'call' ? (
                            <IconArrowUp className='h-3.5 w-3.5 text-[#171711] font-bold' />
                          ) : (
                            <IconArrowDown className='h-3.5 w-3.5 text-white font-bold' />
                          )}
                        </div>
                        <span className='font-bold'>{pos.asset}</span>
                      </div>
                    </td>
                    <td className='py-4 font-medium'>
                      {pos.profit !== null ? 'Expired' : formatTimeLeft(pos.expiresAt)}
                    </td>
                    <td className='py-4 font-mono'>{pos.strikePrice.toFixed(5)}</td>
                    <td className='py-4 font-mono text-[#0bda24]'>
                      {pos.currentPrice.toFixed(5)}
                    </td>
                    <td className='py-4 font-bold text-slate-300'>
                      ${pos.investment.toFixed(2)}
                    </td>
                    <td className='py-4 text-right'>
                      {pos.profit !== null ? (
                        <span
                          className={`font-bold ${
                            pos.profit >= 0 ? 'text-[#0bda24]' : 'text-[#ef4444]'
                          }`}
                        >
                          {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                        </span>
                      ) : (
                        <span className='font-bold text-slate-500'>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </footer>
    </div>
  );
}
