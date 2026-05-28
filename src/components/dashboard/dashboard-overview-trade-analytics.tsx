'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { IconTrendingUp, IconTrendingDown, IconChartBar } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';
import { cn } from '@/lib/utils';
import {
  aggregatePnLStats,
  buildMonthlySeries,
  cumulativeRoiFromSeries,
  dailyPerformanceFromClosed,
  positionMatchesWalletTab,
  type DashboardPosition,
  type TimeRange
} from '@/lib/dashboard-position-analytics';

export type FinancialSnapshot = {
  balance: number;
  usedMargin: number;
  equity: number;
  freeMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
};

type Props = {
  positions: DashboardPosition[];
  financialReal: FinancialSnapshot;
  financialDemo: FinancialSnapshot;
};

type BalanceType = 'REAL' | 'DEMO';

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);

function MarginsStrip({
  selectedBalance,
  onSelectBalance,
  financialReal,
  financialDemo
}: Pick<
  Props,
  'financialReal' | 'financialDemo'
> & {
  selectedBalance: BalanceType;
  onSelectBalance: (balance: BalanceType) => void;
}) {
  const rows = [
    {
      key: 'REAL' as const,
      label: 'Real',
      f: financialReal,
      accent: 'text-[var(--trade-green)]'
    },
    {
      key: 'DEMO' as const,
      label: 'Demo',
      f: financialDemo,
      accent: 'text-[var(--trade-text-muted)]'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map(({ key, label, f, accent }) => (
        <div
          key={key}
          role="button"
          tabIndex={0}
          onClick={() => onSelectBalance(key)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectBalance(key);
            }
          }}
          aria-pressed={selectedBalance === key}
          className={cn(
            'rounded-lg border px-3 py-2.5 transition-colors',
            'border-[var(--trade-border)] bg-[var(--trade-dark)]/80',
            'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--trade-accent-blue)]',
            selectedBalance === key &&
              'border-[var(--trade-accent-blue)] bg-[var(--trade-panel)]'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={cn('text-xs font-semibold uppercase tracking-wide', accent)}>
              {label}
            </span>
            <span className="text-[10px] text-[var(--trade-text-muted)]">
              Lev {f.leverage}x
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <span className="text-[var(--trade-text-muted)]">Used margin</span>
            <span className="text-right font-medium tabular-nums text-[var(--trade-text)]">
              {fmtUsd(f.usedMargin)}
            </span>
            <span className="text-[var(--trade-text-muted)]">Free margin</span>
            <span className="text-right font-medium tabular-nums text-[var(--trade-text)]">
              {fmtUsd(f.freeMargin)}
            </span>
            <span className="text-[var(--trade-text-muted)]">Equity</span>
            <span className="text-right font-medium tabular-nums text-[var(--trade-text)]">
              {fmtUsd(f.equity)}
            </span>
            <span className="text-[var(--trade-text-muted)]">Margin level</span>
            <span className="text-right font-medium tabular-nums text-[var(--trade-text)]">
              {f.marginLevel != null ? `${f.marginLevel.toFixed(0)}%` : '—'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardOverviewTradeAnalytics({
  positions,
  financialReal,
  financialDemo
}: Props) {
  const [range, setRange] = useState<TimeRange>('1y');
  const [selectedBalance, setSelectedBalance] = useState<BalanceType>('REAL');

  const selectedFinancial = useMemo(() => {
    if (selectedBalance === 'DEMO') return financialDemo;
    return financialReal;
  }, [selectedBalance, financialReal, financialDemo]);

  const filteredPositions = useMemo(
    () => positions.filter((p) => positionMatchesWalletTab(p, selectedBalance)),
    [positions, selectedBalance]
  );

  const balanceBase = selectedFinancial.balance;

  const stats = useMemo(() => aggregatePnLStats(filteredPositions), [filteredPositions]);
  const daily = useMemo(() => dailyPerformanceFromClosed(filteredPositions), [filteredPositions]);

  const monthlySeries = useMemo(
    () => buildMonthlySeries(filteredPositions, balanceBase, range),
    [filteredPositions, balanceBase, range]
  );

  const { roiPct, pnlUsd } = useMemo(
    () => cumulativeRoiFromSeries(monthlySeries),
    [monthlySeries]
  );

  const profitFactorDisplay =
    !Number.isFinite(stats.profitFactor) || stats.profitFactor > 9999
      ? '∞'
      : stats.profitFactor.toFixed(2);

  const totalT = Math.max(stats.totalTrades, 1);
  const buyPct = (stats.buyCount / totalT) * 100;
  const sellPct = (stats.sellCount / totalT) * 100;
  const winTradePct = (stats.profitableCount / totalT) * 100;
  const loseTradePct = (stats.losingCount / totalT) * 100;

  const pieDaily =
    daily.profitableDays === 0 && daily.losingDays === 0
      ? [{ name: 'No activity', value: 1, fill: 'var(--trade-border)' }]
      : [
          {
            name: 'Profitable days',
            value: daily.profitableDays,
            fill: 'var(--trade-green)'
          },
          {
            name: 'Losing days',
            value: daily.losingDays,
            fill: 'var(--trade-red)'
          }
        ];

  return (
    <div className="space-y-4 pb-8">
      <MarginsStrip
        selectedBalance={selectedBalance}
        onSelectBalance={setSelectedBalance}
        financialReal={financialReal}
        financialDemo={financialDemo}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ROI */}
        <div className={cn('flex flex-col rounded-xl', TRADE_ROOM_CARD_CLASS)}>
          <div className="flex flex-wrap items-start justify-between gap-3 px-4">
            <div>
              <p className="text-sm font-medium text-[var(--trade-text-muted)]">ROI</p>
              <p className="text-2xl font-semibold tabular-nums text-[var(--trade-text)]">
                {roiPct.toFixed(2)}%
              </p>
              <p className="text-sm tabular-nums text-[var(--trade-text-muted)]">
                {fmtUsd(pnlUsd)}
              </p>
            </div>
            <div className="flex gap-1 rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] p-0.5">
              {(['3m', '1y', 'all'] as const).map((k) => (
                <Button
                  key={k}
                  type="button"
                  variant={range === k ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs',
                    range === k
                      ? 'bg-[var(--trade-border)] text-[var(--trade-text)]'
                      : 'text-[var(--trade-text-muted)]'
                  )}
                  onClick={() => setRange(k)}
                >
                  {k.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div className="h-[260px] min-h-[220px] w-full px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--trade-green)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--trade-green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--trade-text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--trade-text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--trade-panel)',
                    border: '1px solid var(--trade-border)',
                    borderRadius: 8,
                    fontSize: 12
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                  labelFormatter={(l) => String(l)}
                />
                <Area
                  type="monotone"
                  dataKey="roiPct"
                  stroke="var(--trade-green)"
                  strokeWidth={2}
                  fill="url(#roiFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade performance */}
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              'flex flex-1 items-center justify-between rounded-xl px-4',
              TRADE_ROOM_CARD_CLASS
            )}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--trade-green)]/15 p-2">
                <IconTrendingUp className="size-5 text-[var(--trade-green)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--trade-text-muted)]">Average Win</p>
                <p className="text-lg font-semibold tabular-nums text-[var(--trade-text)]">
                  {fmtUsd(stats.avgWin)}
                </p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'flex flex-1 items-center justify-between rounded-xl px-4',
              TRADE_ROOM_CARD_CLASS
            )}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--trade-red)]/15 p-2">
                <IconTrendingDown className="size-5 text-[var(--trade-red)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--trade-text-muted)]">Average Loss</p>
                <p className="text-lg font-semibold tabular-nums text-[var(--trade-text)]">
                  {fmtUsd(stats.avgLoss)}
                </p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'flex flex-1 items-center justify-between rounded-xl px-4',
              TRADE_ROOM_CARD_CLASS
            )}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--trade-accent-blue)]/15 p-2">
                <IconChartBar className="size-5 text-[var(--trade-accent-blue)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--trade-text-muted)]">Profit Factor</p>
                <p className="text-lg font-semibold tabular-nums text-[var(--trade-text)]">
                  {profitFactorDisplay}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Trade summary */}
        <div className={cn('rounded-xl', TRADE_ROOM_CARD_CLASS)}>
          <p className="px-4 text-sm font-semibold text-[var(--trade-text)]">Trade Summary</p>
          <p className="px-4 text-xs text-[var(--trade-text-muted)]">
            Total trades: {stats.totalTrades}
          </p>
          <div className="mt-4 space-y-4 px-4 pb-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--trade-text-muted)]">Buys</span>
                <span className="tabular-nums text-[var(--trade-text)]">
                  {stats.buyCount} ({buyPct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--trade-border)]">
                <div
                  className="h-full rounded-full bg-[var(--trade-green)]"
                  style={{ width: `${buyPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--trade-text-muted)]">Sells</span>
                <span className="tabular-nums text-[var(--trade-text)]">
                  {stats.sellCount} ({sellPct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--trade-border)]">
                <div
                  className="h-full rounded-full bg-[var(--trade-red)]"
                  style={{ width: `${sellPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--trade-text-muted)]">Profitable trades</span>
                <span className="tabular-nums text-[var(--trade-text)]">
                  {stats.profitableCount} ({winTradePct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--trade-border)]">
                <div
                  className="h-full rounded-full bg-[var(--trade-green)]"
                  style={{ width: `${winTradePct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--trade-text-muted)]">Losing trades</span>
                <span className="tabular-nums text-[var(--trade-text)]">
                  {stats.losingCount} ({loseTradePct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--trade-border)]">
                <div
                  className="h-full rounded-full bg-[var(--trade-red)]"
                  style={{ width: `${loseTradePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily performance */}
        <div className={cn('rounded-xl', TRADE_ROOM_CARD_CLASS)}>
          <p className="px-4 text-sm font-semibold text-[var(--trade-text)]">Daily Performance</p>
          <p className="px-4 text-xs text-[var(--trade-text-muted)]">
            Total days: {daily.totalDays}
          </p>
          <div className="mt-2 flex flex-col items-center gap-4 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-[var(--trade-text-muted)]">Profitable days</span>
                <span className="font-medium tabular-nums text-[var(--trade-green)]">
                  {daily.profitableDays} ({daily.profitablePct.toFixed(0)}%)
                </span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-[var(--trade-text-muted)]">Losing days</span>
                <span className="font-medium tabular-nums text-[var(--trade-red)]">
                  {daily.losingDays} ({daily.losingPct.toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDaily}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={64}
                    stroke="none"
                  >
                    {pieDaily.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--trade-panel)',
                      border: '1px solid var(--trade-border)',
                      borderRadius: 8,
                      fontSize: 12
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly ROI bars */}
      <div className={cn('rounded-xl', TRADE_ROOM_CARD_CLASS)}>
        <p className="px-4 text-sm font-semibold text-[var(--trade-text)]">Monthly ROI</p>
        <div className="h-[200px] w-full px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--trade-text-muted)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--trade-text-muted)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--trade-panel)',
                  border: '1px solid var(--trade-border)',
                  borderRadius: 8,
                  fontSize: 12
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Month']}
              />
              <Bar dataKey="monthRoiPct" radius={[4, 4, 0, 0]} fill="var(--trade-accent-blue)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
