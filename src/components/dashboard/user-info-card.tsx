'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconWallet,
  IconScale,
  IconChartLine,
  IconCash
} from '@tabler/icons-react';

interface UserInfoCardProps {
  user: {
    name: string | null;
    email: string;
    balance: number;
    leverage: number;
  };
  financial: {
    balance: number;
    equity: number;
    freeMargin: number;
    usedMargin: number;
    marginLevel: number | null;
    totalPnL: number;
  };
}

export function UserInfoCard({ user, financial }: UserInfoCardProps) {
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
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(financial.balance)}
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
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(financial.equity)}
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
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(financial.freeMargin)}
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <div className='rounded-lg bg-orange-100 p-2 dark:bg-orange-900'>
              <IconScale className='h-5 w-5 text-orange-600 dark:text-orange-400' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Leverage</p>
              <p className='text-xl font-bold'>1:{user.leverage}</p>
            </div>
          </div>
        </div>

        {/* Additional margin info */}
        <div className='mt-6 grid gap-4 border-t pt-4 md:grid-cols-3'>
          <div>
            <p className='text-muted-foreground text-sm'>Used Margin</p>
            <p className='text-lg font-semibold'>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(financial.usedMargin)}
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
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(financial.totalPnL)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
