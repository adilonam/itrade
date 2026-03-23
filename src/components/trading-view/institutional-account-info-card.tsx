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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className='text-muted-foreground'>
          Loading balance information...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!financial) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <div className='flex items-start space-x-3'>
            <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900'>
              <IconWallet className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Balance</p>
              <p className='text-xl font-bold'>
                {currencyFormatter.format(financial.balance)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg bg-green-100 p-2 dark:bg-green-900'>
              <IconChartLine className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Equity</p>
              <p className='text-xl font-bold'>
                {currencyFormatter.format(financial.equity)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg bg-purple-100 p-2 dark:bg-purple-900'>
              <IconCash className='h-5 w-5 text-purple-600 dark:text-purple-400' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Free Margin</p>
              <p className='text-xl font-bold'>
                {currencyFormatter.format(financial.freeMargin)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg bg-orange-100 p-2 dark:bg-orange-900'>
              <IconScale className='h-5 w-5 text-orange-600 dark:text-orange-400' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Leverage</p>
              <p className='text-xl font-bold'>1:{financial.leverage}</p>
            </div>
          </div>
        </div>

        <div className='mt-6 grid gap-4 border-t pt-4 md:grid-cols-3'>
          <div>
            <p className='text-muted-foreground text-sm'>Used Margin</p>
            <p className='text-lg font-semibold'>
              {currencyFormatter.format(financial.usedMargin)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Margin Level</p>
            <p className='text-lg font-semibold'>
              {financial.marginLevel !== null
                ? `${financial.marginLevel.toFixed(2)}%`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Unrealized P&L</p>
            <p
              className={`text-lg font-semibold ${
                financial.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
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
