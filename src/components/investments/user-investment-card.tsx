'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  IconCalendar,
  IconMapPin,
  IconTrendingUp,
  IconClock,
  IconShield,
  IconRefresh
} from '@tabler/icons-react';

interface UserInvestmentData {
  id: string;
  amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: Date;
  endDate: Date;
  expectedReturn: number;
  actualReturn?: number | null;
  autoReinvest: boolean;
  investment: {
    id: string;
    title: string;
    country: string;
    duration: number;
    rentability: number;
    riskLevel: string;
    imageUrl?: string | null;
  };
}

interface UserInvestmentCardProps {
  userInvestment: UserInvestmentData;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW':
      return 'text-green-600';
    case 'HIGH':
      return 'text-red-600';
    default: // MEDIUM
      return 'text-yellow-600';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const calculateProgress = (startDate: Date, endDate: Date) => {
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return { progress, daysRemaining };
};

export function UserInvestmentCard({
  userInvestment,
  className
}: UserInvestmentCardProps) {
  const { progress, daysRemaining } = calculateProgress(
    new Date(userInvestment.startDate),
    new Date(userInvestment.endDate)
  );

  const isCompleted = userInvestment.status === 'COMPLETED';
  const totalReturn = isCompleted
    ? userInvestment.actualReturn || userInvestment.expectedReturn
    : userInvestment.expectedReturn;

  const totalAmount = userInvestment.amount + totalReturn;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        className
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0'>
          <div className='min-w-0 flex-1 space-y-1'>
            <CardTitle className='truncate text-lg font-semibold'>
              {userInvestment.investment.title}
            </CardTitle>
            <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm'>
              <div className='flex items-center'>
                <IconMapPin className='mr-1 h-3 w-3 flex-shrink-0' />
                {userInvestment.investment.country}
              </div>
              <div className='flex items-center'>
                <IconCalendar className='mr-1 h-3 w-3 flex-shrink-0' />
                {userInvestment.investment.duration} months
              </div>
              <div
                className={cn(
                  'flex items-center font-medium',
                  getRiskColor(userInvestment.investment.riskLevel)
                )}
              >
                <IconShield className='mr-1 h-3 w-3 flex-shrink-0' />
                {userInvestment.investment.riskLevel}
              </div>
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2 sm:flex-nowrap'>
            {userInvestment.autoReinvest && (
              <Badge variant='outline' className='text-xs whitespace-nowrap'>
                <IconRefresh className='mr-1 h-3 w-3 flex-shrink-0' />
                Auto-reinvest
              </Badge>
            )}
            <Badge
              className={cn(
                getStatusColor(userInvestment.status),
                'whitespace-nowrap'
              )}
            >
              {userInvestment.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-muted-foreground font-medium'>Investment</p>
            <p className='text-lg font-semibold'>
              {formatCurrency(userInvestment.amount)}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground font-medium'>
              {isCompleted ? 'Final Return' : 'Expected Return'}
            </p>
            <div className='flex items-center font-semibold text-green-600'>
              <IconTrendingUp className='mr-1 h-4 w-4' />
              {formatCurrency(totalReturn)}
            </div>
          </div>
        </div>

        {userInvestment.status === 'ACTIVE' && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Progress</span>
              <div className='text-muted-foreground flex items-center'>
                <IconClock className='mr-1 h-3 w-3' />
                {daysRemaining} days left
              </div>
            </div>
            <Progress value={progress} className='h-2' />
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>
                Started: {formatDate(new Date(userInvestment.startDate))}
              </span>
              <span>Ends: {formatDate(new Date(userInvestment.endDate))}</span>
            </div>
          </div>
        )}

        {userInvestment.status === 'COMPLETED' && (
          <div className='rounded-lg bg-green-50 p-3 dark:bg-green-950/20'>
            <div className='flex items-center justify-between text-sm font-medium'>
              <span className='text-green-700 dark:text-green-300'>
                Total Received
              </span>
              <span className='text-lg text-green-700 dark:text-green-300'>
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <p className='mt-1 text-xs text-green-600 dark:text-green-400'>
              Investment completed on{' '}
              {formatDate(new Date(userInvestment.endDate))}
            </p>
          </div>
        )}

        <div className='flex items-center justify-between border-t pt-2'>
          <div className='text-muted-foreground text-sm'>
            Annual Return: {userInvestment.investment.rentability}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
