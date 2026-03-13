'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Position {
  id: string;
  type: string;
  status: string;
  room: string;
  pnl: number | null;
  market: {
    symbol: string;
    name: string;
    type: string;
  } | null;
}

interface UserInvestment {
  id: string;
  amount: number;
  status: string;
  expectedReturn: number;
  actualReturn: number | null;
}

interface DashboardStatsGridProps {
  positions: {
    trading: Position[];
    stock: Position[];
  };
  investments: UserInvestment[];
}

export function DashboardStatsGrid({
  positions,
  investments
}: DashboardStatsGridProps) {
  // Calculate trading stats
  const tradingPositions = positions.trading.filter(
    (p) => p.status === 'PLACED'
  );
  const tradingPnL = tradingPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const tradingWinning = tradingPositions.filter(
    (p) => (p.pnl || 0) > 0
  ).length;
  const tradingLosing = tradingPositions.filter((p) => (p.pnl || 0) < 0).length;

  // Calculate stock stats
  const stockPositions = positions.stock.filter((p) => p.status === 'PLACED');
  const stockPnL = stockPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const stockWinning = stockPositions.filter((p) => (p.pnl || 0) > 0).length;
  const stockLosing = stockPositions.filter((p) => (p.pnl || 0) < 0).length;

  // Calculate investment stats
  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
  const completedInvestments = investments.filter(
    (i) => i.status === 'COMPLETED'
  );
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  const totalCompletedReturns = completedInvestments.reduce(
    (sum, i) => sum + (i.actualReturn || 0),
    0
  );

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {/* Trading Room Stats */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>
            Trading Room Positions
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Total</span>
            <span className='font-bold'>{tradingPositions.length}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-green-600'>Winning</span>
            <span className='font-bold text-green-600'>{tradingWinning}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-red-600'>Losing</span>
            <span className='font-bold text-red-600'>{tradingLosing}</span>
          </div>
          <div className='border-t pt-3'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>P&L</span>
              <span
                className={`font-bold ${
                  tradingPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {tradingPnL >= 0 ? '+' : ''}${tradingPnL.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Room Stats */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>
            Stock Room Positions
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Total</span>
            <span className='font-bold'>{stockPositions.length}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-green-600'>Winning</span>
            <span className='font-bold text-green-600'>{stockWinning}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-red-600'>Losing</span>
            <span className='font-bold text-red-600'>{stockLosing}</span>
          </div>
          <div className='border-t pt-3'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>P&L</span>
              <span
                className={`font-bold ${
                  stockPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stockPnL >= 0 ? '+' : ''}${stockPnL.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Stats */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>Investments</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Active</span>
            <span className='font-bold'>{activeInvestments.length}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>Completed</span>
            <span className='font-bold'>{completedInvestments.length}</span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              Total Invested
            </span>
            <span className='font-bold'>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR'
              }).format(totalInvested)}
            </span>
          </div>
          <div className='border-t pt-3'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                Completed Returns
              </span>
              <span className='font-bold text-green-600'>
                +
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(totalCompletedReturns)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
