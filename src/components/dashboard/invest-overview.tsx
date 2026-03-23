'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconPigMoney,
  IconTrendingUp,
  IconCheck,
  IconClock,
  IconRefresh,
  IconArrowRight,
  IconChartBar
} from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type UserInvestment = {
  id: string;
  amount: number;
  status: string;
  expectedReturn: number;
  actualReturn: number | null;
  startDate: string;
  endDate: string;
  investment: {
    id: string;
    title: string;
    rentability: number;
    duration: number;
    country: string;
  };
};

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    value
  );

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

export function InvestOverview() {
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/user/investments?balanceType=REAL');
      if (!res.ok) throw new Error('Failed to fetch investments');
      const data = await res.json();
      setInvestments(data.userInvestments ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load investment data'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
  const completedInvestments = investments.filter(
    (i) => i.status === 'COMPLETED'
  );
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  const totalExpectedReturns = activeInvestments.reduce(
    (sum, i) => sum + i.expectedReturn,
    0
  );
  const totalCompletedReturns = completedInvestments.reduce(
    (sum, i) => sum + (i.actualReturn ?? 0),
    0
  );

  if (loading && investments.length === 0) {
    return (
      <div className='space-y-6'>
        <div className='bg-muted h-8 w-64 animate-pulse rounded' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className='bg-muted h-4 w-24 animate-pulse rounded' />
              </CardHeader>
              <CardContent>
                <div className='bg-muted h-8 w-28 animate-pulse rounded' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Invest Overview</h2>
          <p className='text-muted-foreground'>
            Summary of your investments and returns.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={loadData}
            disabled={loading}
          >
            <IconRefresh
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button size='sm' asChild>
            <Link href='/investments'>
              My Investments
              <IconArrowRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Invested
            </CardTitle>
            <IconPigMoney className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatUsd(totalInvested)}</div>
            <p className='text-muted-foreground text-xs'>
              {activeInvestments.length} active investment
              {activeInvestments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Expected Returns
            </CardTitle>
            <IconTrendingUp className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              +{formatUsd(totalExpectedReturns)}
            </div>
            <p className='text-muted-foreground text-xs'>
              From active investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
            <IconCheck className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {completedInvestments.length}
            </div>
            <p className='text-muted-foreground text-xs'>Investments closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Returns Received
            </CardTitle>
            <IconChartBar className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              +{formatUsd(totalCompletedReturns)}
            </div>
            <p className='text-muted-foreground text-xs'>
              From completed investments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active investments list */}
      {activeInvestments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconClock className='h-5 w-5' />
              Active Investments
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Your current investment positions. View details on My Investments.
            </p>
          </CardHeader>
          <CardContent>
            <ul className='divide-y'>
              {activeInvestments.slice(0, 5).map((inv) => (
                <li
                  key={inv.id}
                  className='flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0'
                >
                  <div>
                    <p className='font-medium'>{inv.investment.title}</p>
                    <p className='text-muted-foreground text-xs'>
                      {inv.investment.country} · {inv.investment.duration} mo ·{' '}
                      {inv.investment.rentability}% · Ends{' '}
                      {formatDate(inv.endDate)}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='font-semibold'>{formatUsd(inv.amount)}</p>
                    <p className='text-xs text-green-600'>
                      +{formatUsd(inv.expectedReturn)} expected
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {activeInvestments.length > 5 && (
              <p className='text-muted-foreground mt-2 text-sm'>
                +{activeInvestments.length - 5} more ·{' '}
                <Link
                  href='/investments'
                  className='text-primary hover:underline'
                >
                  View all
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {investments.length === 0 && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <IconPigMoney className='text-muted-foreground h-12 w-12' />
            <p className='mt-4 font-medium'>No investments yet</p>
            <p className='text-muted-foreground text-sm'>
              Browse investment opportunities and start investing.
            </p>
            <Button className='mt-4' asChild>
              <Link href='/investments'>Go to My Investments</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
