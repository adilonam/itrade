'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import { UserPositionsTableRoomStock } from '@/components/user/portfolio/user-positions-table-room-stock';
import { PortfolioSummary } from '@/components/user/portfolio/portfolio-summary';
import type { Position, Market, User } from '@prisma/client';

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
};

// Position filters interface
type PositionFilters = {
  userId?: string;
  type?: string;
  status?: string;
  room?: string;
  marketId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
};

import {
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
  IconCoins
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function StockPortfolioView() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<PositionWithRelations[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<PositionFilters>({
    search: '',
    type: undefined,
    status: undefined
  });

  const [currentFilters, setCurrentFilters] = useState<PositionFilters>({});

  // Load positions
  const loadPositions = useCallback(
    async (page = 1, newFilters: PositionFilters = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          room: 'STOCK'
        });

        // Add filter values, handling Date objects and undefined values
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            if (value instanceof Date) {
              params.set(key, value.toISOString());
            } else {
              params.set(key, value.toString());
            }
          }
        });

        const response = await fetch(`/api/user/positions?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch positions');
        }

        const data = await response.json();
        setPositions(data.positions);
        setPagination(data.pagination);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load positions'
        );
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  // Load data on mount and when filters change
  useEffect(() => {
    loadPositions(1, currentFilters);
  }, [currentFilters, loadPositions]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PositionFilters, value: any) => {
    // Convert 'all' to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value;
    setFilters((prev) => ({ ...prev, [key]: filterValue }));
  };

  const applyFilters = () => {
    setCurrentFilters(filters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    loadPositions(newPage, currentFilters);
  };

  // Handle position close
  const handleClosePosition = async (positionId: string) => {
    try {
      const response = await fetch(`/api/user/positions/${positionId}/close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'CLOSED' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close position');
      }

      toast.success('Position closed successfully');
      loadPositions(pagination.page, currentFilters);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to close position'
      );
    }
  };

  const handleRefresh = () => {
    loadPositions(pagination.page, currentFilters);
  };

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    // Get user balance from session
    const userBalance = session?.user?.balance || 0;

    // Sum of required margins only from PLACED positions
    const usedMargin = positions.reduce((sum, position) => {
      if (position.status === 'PLACED') {
        return sum + (position.requiredMargin || 0);
      }
      return sum;
    }, 0);

    // Sum of all PnL from positions
    const totalPnL = positions
      .filter((position) => position.status === 'PLACED')
      .reduce((sum, position) => {
        return sum + (position.pnl || 0);
      }, 0);

    // Equity = balance + total PnL
    const equity = userBalance + totalPnL;

    // Free margin = equity - used margin
    const freeMargin = equity - usedMargin;

    return {
      usedMargin,
      totalPnL,
      equity,
      freeMargin,
      userBalance
    };
  }, [positions, session?.user?.balance]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPositions = positions.length;

    // Calculate summary statistics
    const totalPnL = positions.reduce((sum, position) => {
      return sum + (position.pnl || 0);
    }, 0);

    const profitablePositions = positions.filter((position) => {
      return (position.pnl || 0) > 0;
    }).length;

    const losingPositions = positions.filter((position) => {
      return (position.pnl || 0) < 0;
    }).length;

    return {
      totalPositions,
      totalPnL,
      profitablePositions,
      losingPositions
    };
  }, [positions]);

  return (
    <div className='max-w-[1000px] space-y-6 overflow-x-auto'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Stock Positions
            </CardTitle>
            <IconCoins className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summaryStats.totalPositions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total P&L</CardTitle>
            {summaryStats.totalPnL >= 0 ? (
              <IconTrendingUp className='h-4 w-4 text-green-600' />
            ) : (
              <IconTrendingDown className='h-4 w-4 text-red-600' />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summaryStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summaryStats.totalPnL >= 0 ? '+' : ''}$
              {summaryStats.totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Profitable</CardTitle>
            <IconChartBar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {summaryStats.profitablePositions}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Losing</CardTitle>
            <IconChartBar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {summaryStats.losingPositions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finance Card */}
      <UserFinanceCard
        balance={financialMetrics.userBalance}
        usedMargin={financialMetrics.usedMargin}
        equity={financialMetrics.equity}
      />

      {/* Portfolio Summary */}
      <PortfolioSummary
        positions={positions}
        financialMetrics={{
          userBalance: financialMetrics.userBalance,
          usedMargin: financialMetrics.usedMargin,
          equity: financialMetrics.equity,
          freeMargin: financialMetrics.freeMargin
        }}
        onClosePosition={handleClosePosition}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconFilter className='h-5 w-5' />
            Filters
          </CardTitle>
          <CardDescription>
            Filter your stock positions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Search</label>
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Search descriptions...'
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Type</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  <SelectItem value='BUY'>Buy</SelectItem>
                  <SelectItem value='SELL'>Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='PLACED'>Placed</SelectItem>
                  <SelectItem value='CLOSED'>Closed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='PENDING'>Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-4 flex gap-2'>
            <Button onClick={applyFilters}>Apply Filters</Button>
            <Button variant='outline' onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={loading}
            >
              <IconRefresh className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          Showing {positions.length} of {pagination.total} stock positions
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Positions Table */}
      <UserPositionsTableRoomStock positions={positions} loading={loading} />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <IconChevronLeft className='h-4 w-4' />
            Previous
          </Button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.page === page ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handlePageChange(page)}
                  className='h-8 w-8 p-0'
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
            <IconChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
