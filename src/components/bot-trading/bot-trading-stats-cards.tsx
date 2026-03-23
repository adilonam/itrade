'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface BotTradingStats {
  activeBots: number;
  maxBots: number;
  profit24h: number;
  totalEquity: number;
  successRate: number | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    amount
  );

function StatCardSkeleton() {
  return (
    <Card className='border-border/50'>
      <CardContent className='p-5'>
        <div className='bg-muted/50 mb-2 h-3 w-16 animate-pulse rounded' />
        <div className='bg-muted/50 h-8 w-24 animate-pulse rounded' />
      </CardContent>
    </Card>
  );
}

export function BotTradingStatsCards() {
  const [stats, setStats] = useState<BotTradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/user/bot-trading/stats?balanceType=REAL')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      })
      .then((data: BotTradingStats) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load stats');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-border/50 col-span-full'>
          <CardContent className='py-6 text-center text-muted-foreground'>
            {error ?? 'Unable to load stats.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const profit24hFormatted =
    stats.profit24h >= 0
      ? `+${formatCurrency(stats.profit24h)}`
      : formatCurrency(stats.profit24h);
  const profit24hPositive = stats.profit24h >= 0;

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <Card className='border-border/50'>
        <CardContent className='p-5'>
          <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
            Active Bots
          </p>
          <p className='text-2xl font-bold'>
            {stats.activeBots}{' '}
            <span className='text-muted-foreground ml-1 text-sm font-normal'>
              / {stats.maxBots}
            </span>
          </p>
        </CardContent>
      </Card>
      <Card className='border-border/50'>
        <CardContent className='p-5'>
          <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
            24h Profit
          </p>
          <p
            className={profit24hPositive ? 'text-2xl font-bold text-primary' : 'text-2xl font-bold text-destructive'}
          >
            {profit24hFormatted}
          </p>
        </CardContent>
      </Card>
      <Card className='border-border/50'>
        <CardContent className='p-5'>
          <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
            Total Equity
          </p>
          <p className='text-2xl font-bold'>{formatCurrency(stats.totalEquity)}</p>
        </CardContent>
      </Card>
      <Card className='border-border/50'>
        <CardContent className='p-5'>
          <p className='text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider'>
            Success Rate
          </p>
          <p className='text-2xl font-bold text-primary'>
            {stats.successRate != null ? `${stats.successRate.toFixed(1)}%` : '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
