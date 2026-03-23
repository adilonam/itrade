'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconCheck,
  IconClock,
  IconX
} from '@tabler/icons-react';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';

type PositionStats = {
  totalPositions: number;
  totalVolume: number;
  totalPnL: number;
  completedPositions: number;
  pendingPositions: number;
  failedPositions: number;
};

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
    if (pnl > 0) return 'text-[var(--trade-green)]';
    if (pnl < 0) return 'text-[var(--trade-red)]';
    return 'text-[var(--trade-text-muted)]';
  };

  const getPnLIcon = (pnl: number) => {
    if (pnl > 0) {
      return (
        <IconTrendingUp className='h-4 w-4 text-[var(--trade-green)]' />
      );
    }
    if (pnl < 0) {
      return <IconTrendingDown className='h-4 w-4 text-[var(--trade-red)]' />;
    }
    return null;
  };

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-0 pt-0'>
          <CardTitle className='text-xs font-medium text-[var(--trade-text-muted)]'>
            Total Positions
          </CardTitle>
          <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
            <IconCurrencyDollar className='h-4 w-4 text-[var(--trade-accent-blue)]' />
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2'>
          <div className='font-mono text-lg font-bold tabular-nums'>
            {formatNumber(stats.totalPositions)}
          </div>
          <p className='text-xs text-[var(--trade-text-muted)]'>All time positions</p>
        </CardContent>
      </Card>

      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-0 pt-0'>
          <CardTitle className='text-xs font-medium text-[var(--trade-text-muted)]'>
            Total Volume
          </CardTitle>
          <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
            <IconCurrencyDollar className='h-4 w-4 text-[var(--trade-accent-blue)]' />
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2'>
          <div className='font-mono text-lg font-bold tabular-nums'>
            {formatCurrency(stats.totalVolume)}
          </div>
          <p className='text-xs text-[var(--trade-text-muted)]'>
            Total position volume
          </p>
        </CardContent>
      </Card>

      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-0 pt-0'>
          <CardTitle className='text-xs font-medium text-[var(--trade-text-muted)]'>
            Total P&L
          </CardTitle>
          <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
            {getPnLIcon(stats.totalPnL) ?? (
              <IconCurrencyDollar className='h-4 w-4 text-[var(--trade-text-muted)]' />
            )}
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2'>
          <div
            className={`font-mono text-lg font-bold tabular-nums ${getPnLColor(stats.totalPnL)}`}
          >
            {formatCurrency(stats.totalPnL)}
          </div>
          <p className='text-xs text-[var(--trade-text-muted)]'>Profit & Loss</p>
        </CardContent>
      </Card>

      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-0 pt-0'>
          <CardTitle className='text-xs font-medium text-[var(--trade-text-muted)]'>
            Completed
          </CardTitle>
          <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
            <IconCheck className='h-4 w-4 text-[var(--trade-green)]' />
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2'>
          <div className='font-mono text-lg font-bold tabular-nums text-[var(--trade-green)]'>
            {formatNumber(stats.completedPositions)}
          </div>
          <p className='text-xs text-[var(--trade-text-muted)]'>
            Successfully completed
          </p>
        </CardContent>
      </Card>

      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-0 pt-0'>
          <CardTitle className='text-xs font-medium text-[var(--trade-text-muted)]'>
            Pending
          </CardTitle>
          <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
            <IconClock className='h-4 w-4 text-amber-400' />
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2'>
          <div className='font-mono text-lg font-bold tabular-nums text-amber-400'>
            {formatNumber(stats.pendingPositions)}
          </div>
          <p className='text-xs text-[var(--trade-text-muted)]'>Awaiting processing</p>
        </CardContent>
      </Card>

      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 px-4 pb-0 pt-0'>
          <CardTitle className='text-xs font-medium text-[var(--trade-text-muted)]'>
            Failed
          </CardTitle>
          <div className='rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]/40 p-2'>
            <IconX className='h-4 w-4 text-[var(--trade-red)]' />
          </div>
        </CardHeader>
        <CardContent className='px-4 pt-2'>
          <div className='font-mono text-lg font-bold tabular-nums text-[var(--trade-red)]'>
            {formatNumber(stats.failedPositions)}
          </div>
          <p className='text-xs text-[var(--trade-text-muted)]'>Failed positions</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function PositionEnums({
  enums
}: {
  enums: { positionTypes: string[]; positionStatuses: string[] };
}) {
  if (!enums) return null;

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='text-sm font-semibold'>Position Types</CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            Available position types in the system
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='flex flex-wrap gap-2'>
            {enums.positionTypes.map((type) => (
              <Badge
                key={type}
                variant='outline'
                className='border-[var(--trade-border)] text-xs text-[var(--trade-text)]'
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='text-sm font-semibold'>Position Statuses</CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            Available position statuses in the system
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='flex flex-wrap gap-2'>
            {enums.positionStatuses.map((status) => (
              <Badge
                key={status}
                variant='outline'
                className={`border-[var(--trade-border)] text-xs ${
                  status === 'CLOSED'
                    ? 'border-[var(--trade-green)]/50 text-[var(--trade-green)]'
                    : status === 'PLACED'
                      ? 'text-[var(--trade-accent-blue)] border-[var(--trade-accent-blue)]/50'
                      : status === 'PENDING'
                        ? 'border-amber-400/50 text-amber-400'
                        : status === 'FAILED'
                          ? 'border-[var(--trade-red)]/50 text-[var(--trade-red)]'
                          : 'text-[var(--trade-text)]'
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
