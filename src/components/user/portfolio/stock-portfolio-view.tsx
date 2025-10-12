'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StockPortfolioTable } from './stock-portfolio-table';
import {
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconCoins
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PortfolioStock {
  marketId: string;
  symbol: string;
  name: string;
  type: string;
  totalQuantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  totalPnL: number;
  pnlPercentage: number;
  positionCount: number;
}

export function StockPortfolioView() {
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPortfolio = async () => {
    try {
      setError(null);
      const response = await fetch('/api/user/portfolio/stock');

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolio(data.portfolio || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPortfolio();
  };

  // Calculate portfolio summary
  const portfolioSummary = {
    totalValue: portfolio.reduce((sum, stock) => sum + stock.currentValue, 0),
    totalCost: portfolio.reduce((sum, stock) => sum + stock.totalCost, 0),
    totalPnL: portfolio.reduce((sum, stock) => sum + stock.totalPnL, 0),
    totalStocks: portfolio.length,
    totalPositions: portfolio.reduce(
      (sum, stock) => sum + stock.positionCount,
      0
    )
  };

  const portfolioPnLPercentage =
    portfolioSummary.totalCost > 0
      ? (portfolioSummary.totalPnL / portfolioSummary.totalCost) * 100
      : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className='pb-3'>
                <Skeleton className='h-4 w-24' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-32' />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className='h-[400px] w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Value</CardTitle>
            <IconCoins className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(portfolioSummary.totalValue)}
            </div>
            <p className='text-muted-foreground text-xs'>
              Cost: {formatCurrency(portfolioSummary.totalCost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total P&L</CardTitle>
            {portfolioSummary.totalPnL >= 0 ? (
              <IconTrendingUp className='h-4 w-4 text-green-600' />
            ) : (
              <IconTrendingDown className='h-4 w-4 text-red-600' />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                portfolioSummary.totalPnL >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {portfolioSummary.totalPnL >= 0 ? '+' : ''}
              {formatCurrency(portfolioSummary.totalPnL)}
            </div>
            <p
              className={`text-xs font-medium ${
                portfolioSummary.totalPnL >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {portfolioPnLPercentage >= 0 ? '+' : ''}
              {portfolioPnLPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Stocks</CardTitle>
            <IconChartBar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {portfolioSummary.totalStocks}
            </div>
            <p className='text-muted-foreground text-xs'>
              Unique stocks in portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Open Positions
            </CardTitle>
            <IconChartBar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {portfolioSummary.totalPositions}
            </div>
            <p className='text-muted-foreground text-xs'>Active positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Table Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Stock Holdings</h2>
          <p className='text-muted-foreground text-sm'>
            Manage your stock portfolio positions
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <IconRefresh
            className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Portfolio Table */}
      <StockPortfolioTable
        portfolio={portfolio}
        onSellComplete={loadPortfolio}
      />
    </div>
  );
}
