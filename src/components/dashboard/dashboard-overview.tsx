'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconPigMoney,
  IconCoins,
  IconRefresh
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { DashboardStatsGrid } from './dashboard-stats-grid';
import { DashboardCharts } from './dashboard-charts';
import { UserInfoCard } from './user-info-card';
import { UserMessages } from './user-messages';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FinancialData {
  balance: number;
  usedMargin: number;
  equity: number;
  freeMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
}

interface Position {
  id: string;
  type: string;
  status: string;
  room: string;
  quantity: number;
  executedPrice: number | null;
  closedPrice: number | null;
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
  startDate: string;
  endDate: string;
  investment: {
    title: string;
    rentability: number;
    duration: number;
  };
}

interface DashboardData {
  user: {
    name: string | null;
    email: string;
    balance: number;
    leverage: number;
  };
  financial: FinancialData;
  positions: {
    trading: Position[];
    stock: Position[];
  };
  investments: UserInvestment[];
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        financialRes,
        tradingPosRes,
        stockPosRes,
        investmentsRes,
        userRes
      ] = await Promise.all([
        fetch('/api/user/financial'),
        fetch('/api/user/positions?room=TRADING&limit=1000'),
        fetch('/api/user/positions?room=STOCK&limit=1000'),
        fetch('/api/user/investments'),
        fetch('/api/user/profile')
      ]);

      if (
        !financialRes.ok ||
        !tradingPosRes.ok ||
        !stockPosRes.ok ||
        !investmentsRes.ok ||
        !userRes.ok
      ) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [financial, tradingPos, stockPos, investments, userResponse] =
        await Promise.all([
          financialRes.json(),
          tradingPosRes.json(),
          stockPosRes.json(),
          investmentsRes.json(),
          userRes.json()
        ]);

      setData({
        user: {
          name: userResponse.user.name,
          email: userResponse.user.email,
          balance: userResponse.user.balance,
          leverage: financial.leverage
        },
        financial: financial,
        positions: {
          trading: tradingPos.positions || [],
          stock: stockPos.positions || []
        },
        investments: investments.userInvestments || []
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate summary statistics
  const tradingPositions = data.positions.trading.filter(
    (p) => p.status === 'PLACED'
  );
  const stockPositions = data.positions.stock.filter(
    (p) => p.status === 'PLACED'
  );
  const activeInvestments = data.investments.filter(
    (i) => i.status === 'ACTIVE'
  );

  const totalTradingPnL = tradingPositions.reduce(
    (sum, p) => sum + (p.pnl || 0),
    0
  );
  const totalStockPnL = stockPositions.reduce(
    (sum, p) => sum + (p.pnl || 0),
    0
  );
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  const totalExpectedReturns = activeInvestments.reduce(
    (sum, i) => sum + i.expectedReturn,
    0
  );

  const totalPositions = tradingPositions.length + stockPositions.length;
  const totalPnL = totalTradingPnL + totalStockPnL;

  return (
    <div className='space-y-6'>
      {/* Header with refresh button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Dashboard Overview
          </h2>
          <p className='text-muted-foreground'>
            Welcome back, {data.user.name || 'User'}! Here&apos;s your portfolio
            summary. Click refresh to update.
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={loadDashboardData}
          disabled={loading}
        >
          <IconRefresh
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* User Info Card */}
      <UserInfoCard user={data.user} financial={data.financial} />

      {/* Main Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Positions
            </CardTitle>
            <IconCoins className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalPositions}</div>
            <p className='text-muted-foreground text-xs'>
              {tradingPositions.length} trading, {stockPositions.length} stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total P&L</CardTitle>
            {totalPnL >= 0 ? (
              <IconTrendingUp className='h-4 w-4 text-green-600' />
            ) : (
              <IconTrendingDown className='h-4 w-4 text-red-600' />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
            <p className='text-muted-foreground text-xs'>From all positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Investments
            </CardTitle>
            <IconPigMoney className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeInvestments.length}</div>
            <p className='text-muted-foreground text-xs'>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR'
              }).format(totalInvested)}{' '}
              invested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Expected Returns
            </CardTitle>
            <IconChartBar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              +
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR'
              }).format(totalExpectedReturns)}
            </div>
            <p className='text-muted-foreground text-xs'>From investments</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <DashboardStatsGrid
        positions={data.positions}
        investments={data.investments}
      />

      {/* Charts */}
      <DashboardCharts
        positions={data.positions}
        investments={data.investments}
        financial={data.financial}
      />

      {/* Messages */}
      <UserMessages />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='h-12 w-64 animate-pulse rounded bg-gray-200' />
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className='h-4 w-24 animate-pulse rounded bg-gray-200' />
            </CardHeader>
            <CardContent>
              <div className='h-8 w-32 animate-pulse rounded bg-gray-200' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
