'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Position stats type
type PositionStats = {
  totalPositions: number;
  totalVolume: number;
  totalPnL: number;
  completedPositions: number;
  pendingPositions: number;
  failedPositions: number;
};
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconX
} from '@tabler/icons-react';

interface PositionStatsProps {
  stats: PositionStats;
  enums?: {
    positionTypes: string[];
    positionStatuses: string[];
  };
}

export function PositionStats({ stats }: PositionStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnLIcon = (pnl: number) => {
    if (pnl > 0) return <IconTrendingUp className='h-4 w-4' />;
    if (pnl < 0) return <IconTrendingDown className='h-4 w-4' />;
    return null;
  };

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      {/* Total Positions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Positions</CardTitle>
          <IconCurrencyDollar className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatNumber(stats.totalPositions)}
          </div>
          <p className='text-muted-foreground text-xs'>All time positions</p>
        </CardContent>
      </Card>

      {/* Total Volume */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Volume</CardTitle>
          <IconCurrencyDollar className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {formatCurrency(stats.totalVolume)}
          </div>
          <p className='text-muted-foreground text-xs'>Total position volume</p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total P&L</CardTitle>
          {getPnLIcon(stats.totalPnL)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getPnLColor(stats.totalPnL)}`}>
            {formatCurrency(stats.totalPnL)}
          </div>
          <p className='text-muted-foreground text-xs'>Profit & Loss</p>
        </CardContent>
      </Card>

      {/* Completed Positions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Completed</CardTitle>
          <IconCheck className='h-4 w-4 text-green-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            {formatNumber(stats.completedPositions)}
          </div>
          <p className='text-muted-foreground text-xs'>
            Successfully completed
          </p>
        </CardContent>
      </Card>

      {/* Pending Positions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Pending</CardTitle>
          <IconClock className='h-4 w-4 text-yellow-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-yellow-600'>
            {formatNumber(stats.pendingPositions)}
          </div>
          <p className='text-muted-foreground text-xs'>Awaiting processing</p>
        </CardContent>
      </Card>

      {/* Failed Positions */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Failed</CardTitle>
          <IconX className='h-4 w-4 text-red-600' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-red-600'>
            {formatNumber(stats.failedPositions)}
          </div>
          <p className='text-muted-foreground text-xs'>Failed positions</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Additional component to display enums (optional)
export function PositionEnums({
  enums
}: {
  enums: { positionTypes: string[]; positionStatuses: string[] };
}) {
  if (!enums) return null;

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {/* Position Types */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>Position Types</CardTitle>
          <CardDescription>
            Available position types in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {enums.positionTypes.map((type) => (
              <Badge key={type} variant='outline' className='text-xs'>
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Position Statuses */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>
            Position Statuses
          </CardTitle>
          <CardDescription>
            Available position statuses in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {enums.positionStatuses.map((status) => (
              <Badge
                key={status}
                variant='outline'
                className={`text-xs ${
                  status === 'CLOSED'
                    ? 'border-green-500 text-green-700'
                    : status === 'PLACED'
                      ? 'border-blue-500 text-blue-700'
                      : status === 'PENDING'
                        ? 'border-yellow-500 text-yellow-700'
                        : status === 'FAILED'
                          ? 'border-red-500 text-red-700'
                          : ''
                }`}
              >
                {status}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
