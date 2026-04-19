/** Analytics over all trading positions (PLACED + CLOSED) for overview dashboard */

export type DashboardWalletTab = 'REAL' | 'DEMO' | 'INSTITUTIONAL';

export type DashboardPosition = {
  id: string;
  type: string;
  status: string;
  room: string;
  quantity: number;
  pnl: number | null;
  executedAt?: string | null;
  closedAt?: string | null;
  /** Present on `/api/user/positions` — source of truth for wallet after `user_balance_id` migration */
  userBalance?: { type: string } | null;
};

/**
 * Whether a position belongs to the selected overview tab.
 * Prefer wallet type from the API (`userBalance.type`); fall back to `room` for legacy rows.
 */
export function positionMatchesWalletTab(
  p: DashboardPosition,
  tab: DashboardWalletTab
): boolean {
  const explicit = (p as DashboardPosition & { balanceType?: string })
    .balanceType;
  const fromWallet = p.userBalance?.type;
  const wallet =
    explicit === 'REAL' || explicit === 'DEMO' || explicit === 'INSTITUTIONAL'
      ? explicit
      : fromWallet === 'REAL' ||
          fromWallet === 'DEMO' ||
          fromWallet === 'INSTITUTIONAL'
        ? fromWallet
        : null;

  if (wallet) return wallet === tab;

  if (tab === 'INSTITUTIONAL') return p.room === 'INSTITUTIONAL';
  if (tab === 'DEMO') return p.room === 'TRADING';
  return p.room === 'TRADING' || p.room === 'STOCK';
}

export function getPositionPnL(p: DashboardPosition): number {
  if (p.pnl == null || Number.isNaN(p.pnl)) return 0;
  return p.pnl;
}

function monthKeyFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export type TimeRange = '3m' | '1y' | 'all';

/** Closed + open PnL for performance stats */
export function aggregatePnLStats(positions: DashboardPosition[]) {
  const placed = positions.filter((p) => p.status === 'PLACED');
  const closed = positions.filter((p) => p.status === 'CLOSED');

  const pnls = [...placed, ...closed].map(getPositionPnL);
  const wins = pnls.filter((x) => x > 0);
  const losses = pnls.filter((x) => x < 0);

  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

  return {
    totalPnL: pnls.reduce((a, b) => a + b, 0),
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    buyCount: [...placed, ...closed].filter((p) => p.type === 'BUY').length,
    sellCount: [...placed, ...closed].filter((p) => p.type === 'SELL').length,
    profitableCount: [...placed, ...closed].filter((p) => getPositionPnL(p) > 0)
      .length,
    losingCount: [...placed, ...closed].filter((p) => getPositionPnL(p) < 0)
      .length,
    totalTrades: placed.length + closed.length
  };
}

/** Daily buckets from closed positions (realized PnL by close day) */
export function dailyPerformanceFromClosed(positions: DashboardPosition[]) {
  const byDay = new Map<string, number>();
  for (const p of positions) {
    if (p.status !== 'CLOSED' || !p.closedAt) continue;
    const day = p.closedAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + getPositionPnL(p));
  }
  let profitableDays = 0;
  let losingDays = 0;
  for (const v of Array.from(byDay.values())) {
    if (v > 0) profitableDays += 1;
    else if (v < 0) losingDays += 1;
  }
  const totalDays = byDay.size;
  return {
    profitableDays,
    losingDays,
    totalDays,
    profitablePct: totalDays > 0 ? (profitableDays / totalDays) * 100 : 0,
    losingPct: totalDays > 0 ? (losingDays / totalDays) * 100 : 0
  };
}

export type MonthlyRoiPoint = {
  key: string;
  label: string;
  monthPnLUsd: number;
  cumulativePnLUsd: number;
  /** Cumulative ROI % (for area chart) */
  roiPct: number;
  /** This month only, as % of balance base (for bar chart) */
  monthRoiPct: number;
};

function enumerateMonths(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cur = startOfMonth(from);
  const end = startOfMonth(to);
  while (cur <= end) {
    keys.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
    );
    cur = addMonths(cur, 1);
  }
  return keys;
}

/** Monthly PnL: closed in month; current month includes unrealized from PLACED */
export function buildMonthlySeries(
  positions: DashboardPosition[],
  balanceBaseUsd: number,
  range: TimeRange
): MonthlyRoiPoint[] {
  const placed = positions.filter((p) => p.status === 'PLACED');
  const closed = positions.filter((p) => p.status === 'CLOSED');

  const closedMonthPnL = new Map<string, number>();
  const now = new Date();

  for (const p of closed) {
    const mk = monthKeyFromIso(p.closedAt ?? undefined);
    if (!mk) continue;
    closedMonthPnL.set(mk, (closedMonthPnL.get(mk) ?? 0) + getPositionPnL(p));
  }

  const unrealized = placed.reduce((s, p) => s + getPositionPnL(p), 0);
  const currentMonthKey =
    monthKeyFromIso(now.toISOString()) ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let from: Date;
  if (range === '3m') {
    from = addMonths(startOfMonth(now), -2);
  } else if (range === '1y') {
    from = addMonths(startOfMonth(now), -11);
  } else {
    const times: number[] = [];
    for (const p of positions) {
      if (p.closedAt) times.push(new Date(p.closedAt).getTime());
      else if (p.executedAt) times.push(new Date(p.executedAt).getTime());
    }
    const t0 = times.length ? Math.min(...times) : now.getTime();
    from = startOfMonth(new Date(t0));
    if (from > startOfMonth(now)) from = startOfMonth(now);
  }

  let months = enumerateMonths(from, now);
  if (months.length === 0) {
    months = [currentMonthKey];
  }
  const denom = Math.max(balanceBaseUsd, 1);

  let cumulative = 0;
  const out: MonthlyRoiPoint[] = [];

  for (const key of months) {
    let monthPnL = closedMonthPnL.get(key) ?? 0;
    if (key === currentMonthKey) {
      monthPnL += unrealized;
    }
    cumulative += monthPnL;
    const label = new Date(key + '-01').toLocaleString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    out.push({
      key,
      label,
      monthPnLUsd: monthPnL,
      cumulativePnLUsd: cumulative,
      roiPct: (cumulative / denom) * 100,
      monthRoiPct: (monthPnL / denom) * 100
    });
  }

  return out;
}

export function cumulativeRoiFromSeries(series: MonthlyRoiPoint[]): {
  roiPct: number;
  pnlUsd: number;
} {
  if (series.length === 0) return { roiPct: 0, pnlUsd: 0 };
  const last = series[series.length - 1]!;
  return { roiPct: last.roiPct, pnlUsd: last.cumulativePnLUsd };
}
