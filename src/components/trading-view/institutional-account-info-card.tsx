'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconCash,
  IconChartLine,
  IconScale,
  IconWallet
} from '@tabler/icons-react';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';

type FinancialData = {
  balance: number;
  equity: number;
  freeMargin: number;
  usedMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export function InstitutionalAccountInfoCard() {
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinancial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        '/api/user/financial?room=INSTITUTIONAL&balanceType=INSTITUTIONAL'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch institutional financial data');
      }

      const data: FinancialData = await response.json();
      setFinancial(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load institutional balance information'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancial();
  }, [loadFinancial]);

  useEffect(() => {
    const refreshHandler = () => {
      loadFinancial();
    };
    window.addEventListener('room-institutional-balances-refresh', refreshHandler);
    return () =>
      window.removeEventListener(
        'room-institutional-balances-refresh',
        refreshHandler
      );
  }, [loadFinancial]);

  if (loading) {
    return (
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='text-sm font-semibold'>Account Information</CardTitle>
        </CardHeader>
        <CardContent className='px-4 text-xs text-[var(--trade-text-muted)]'>
          Loading balance information...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        variant='destructive'
        className='border-[var(--trade-border)] bg-[var(--trade-panel)] text-sm'
      >
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!financial) {
    return null;
  }

  return (
    <Card className={TRADE_ROOM_CARD_CLASS}>
      <CardHeader className='px-4 pb-0 pt-0'>
        <CardTitle className='text-sm font-semibold'>Account Information</CardTitle>
      </CardHeader>
      <CardContent className='px-4'>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <div className='flex items-start space-x-3'>
            <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
              <IconWallet className='h-4 w-4 text-[var(--trade-accent-blue)]' />
            </div>
            <div>
              <p className='text-xs text-[var(--trade-text-muted)]'>Balance</p>
              <p className='font-mono text-sm font-bold'>
                {currencyFormatter.format(financial.balance)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
              <IconChartLine className='h-4 w-4 text-[var(--trade-green)]' />
            </div>
            <div>
              <p className='text-xs text-[var(--trade-text-muted)]'>Equity</p>
              <p className='font-mono text-sm font-bold'>
                {currencyFormatter.format(financial.equity)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
              <IconCash className='h-4 w-4 text-[var(--trade-accent-blue)]' />
            </div>
            <div>
              <p className='text-xs text-[var(--trade-text-muted)]'>Free Margin</p>
              <p className='font-mono text-sm font-bold'>
                {currencyFormatter.format(financial.freeMargin)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
              <IconScale className='h-4 w-4 text-[var(--trade-text-muted)]' />
            </div>
            <div>
              <p className='text-xs text-[var(--trade-text-muted)]'>Leverage</p>
              <p className='font-mono text-sm font-bold'>1:{financial.leverage}</p>
            </div>
          </div>
        </div>

        <div className='mt-4 grid gap-3 border-t border-[var(--trade-border)] pt-4 md:grid-cols-3'>
          <div>
            <p className='text-xs text-[var(--trade-text-muted)]'>Used Margin</p>
            <p className='font-mono text-sm font-semibold'>
              {currencyFormatter.format(financial.usedMargin)}
            </p>
          </div>
          <div>
            <p className='text-xs text-[var(--trade-text-muted)]'>Margin Level</p>
            <p className='font-mono text-sm font-semibold'>
              {financial.marginLevel !== null
                ? `${financial.marginLevel.toFixed(2)}%`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className='text-xs text-[var(--trade-text-muted)]'>Unrealized P&L</p>
            <p
              className={`font-mono text-sm font-semibold ${
                financial.totalPnL >= 0 ? 'text-[var(--trade-green)]' : 'text-[var(--trade-red)]'
              }`}
            >
              {financial.totalPnL >= 0 ? '+' : ''}
              {currencyFormatter.format(financial.totalPnL)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
