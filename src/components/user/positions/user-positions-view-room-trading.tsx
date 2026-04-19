'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { UserPositionsTableRoomTrading } from './user-positions-table-room-trading';
import { UserFinanceCard } from '@/components/user/finance/user-finance-card';
import type { Position, Market, User } from '@/lib/prisma/generated/client';

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
  IconRefresh
} from '@tabler/icons-react';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FinancialData {
  balance: number;
  usedMargin: number;
  equity: number;
  freeMargin: number;
  marginLevel: number | null;
  totalPnL: number;
  leverage: number;
}

export function UserPositionsViewRoomTrading() {
  const [positions, setPositions] = useState<PositionWithRelations[]>([]);
  const [realTimePnL, setRealTimePnL] = useState<Record<string, number>>({});
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
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
          room: 'TRADING',
          balanceType: 'REAL'
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

  // Load financial data from API
  const loadFinancialData = useCallback(async () => {
    try {
      const response = await fetch('/api/user/financial?room=TRADING&balanceType=REAL');
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }
      const data = await response.json();
      setFinancialData(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load financial data:', err);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadPositions(1, currentFilters);
  }, [currentFilters, loadPositions]);

  // Fetch financial data every 1 second
  useEffect(() => {
    // Initial fetch
    loadFinancialData();

    // Set up interval to fetch every 1 second
    const interval = setInterval(() => {
      loadFinancialData();
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [loadFinancialData]);

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

  const handleRefresh = () => {
    loadPositions(pagination.page, currentFilters);
  };

  // Update real-time PnL for a specific position
  const updateRealTimePnL = useCallback((positionId: string, pnl: number) => {
    setRealTimePnL((prev) => ({
      ...prev,
      [positionId]: pnl
    }));
  }, []);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPositions = positions.length;

    // Use real-time PnL for summary calculations
    const totalPnL = positions.reduce((sum, position) => {
      const currentPnL =
        realTimePnL[position.id] !== undefined
          ? realTimePnL[position.id]
          : position.pnl || 0;
      return sum + currentPnL;
    }, 0);

    const profitablePositions = positions.filter((position) => {
      const currentPnL =
        realTimePnL[position.id] !== undefined
          ? realTimePnL[position.id]
          : position.pnl || 0;
      return currentPnL > 0;
    }).length;

    const losingPositions = positions.filter((position) => {
      const currentPnL =
        realTimePnL[position.id] !== undefined
          ? realTimePnL[position.id]
          : position.pnl || 0;
      return currentPnL < 0;
    }).length;

    return {
      totalPositions,
      totalPnL,
      profitablePositions,
      losingPositions
    };
  }, [positions, realTimePnL]);

  return (
    <div className='w-full space-y-6'>
      {/* Summary Cards */}
      <div className='xs:gap-3 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-3 pb-2 sm:px-6'>
            <CardTitle className='text-xs leading-tight font-medium sm:text-sm'>
              Total Room Trading Positions
            </CardTitle>
          </CardHeader>
          <CardContent className='px-3 sm:px-6'>
            <div className='text-lg font-bold sm:text-2xl'>
              {summaryStats.totalPositions}
            </div>
          </CardContent>
        </Card>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-3 pb-2 sm:px-6'>
            <CardTitle className='text-xs font-medium sm:text-sm'>
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent className='px-3 sm:px-6'>
            <div
              className={`text-lg font-bold sm:text-2xl ${summaryStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {summaryStats.totalPnL >= 0 ? '+' : ''}$
              {summaryStats.totalPnL.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-3 pb-2 sm:px-6'>
            <CardTitle className='text-xs font-medium sm:text-sm'>
              Profitable
            </CardTitle>
          </CardHeader>
          <CardContent className='px-3 sm:px-6'>
            <div className='text-lg font-bold text-green-600 sm:text-2xl'>
              {summaryStats.profitablePositions}
            </div>
          </CardContent>
        </Card>
        <Card className='min-w-0'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 px-3 pb-2 sm:px-6'>
            <CardTitle className='text-xs font-medium sm:text-sm'>
              Losing
            </CardTitle>
          </CardHeader>
          <CardContent className='px-3 sm:px-6'>
            <div className='text-lg font-bold text-red-600 sm:text-2xl'>
              {summaryStats.losingPositions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finance Card */}
      {financialData && (
        <UserFinanceCard
          variant="trade"
          balance={financialData.balance}
          usedMargin={financialData.usedMargin}
          equity={financialData.equity}
          showMarginLevel={true}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconFilter className='h-5 w-5' />
            Filters
          </CardTitle>
          <CardDescription>
            Filter your room trading positions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
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
                  <SelectItem value='DEPOSIT'>Deposit</SelectItem>
                  <SelectItem value='WITHDRAWAL'>Withdrawal</SelectItem>
                  <SelectItem value='TRANSFER_IN'>Transfer In</SelectItem>
                  <SelectItem value='TRANSFER_OUT'>Transfer Out</SelectItem>
                  <SelectItem value='FEE'>Fee</SelectItem>
                  <SelectItem value='BONUS'>Bonus</SelectItem>
                  <SelectItem value='REFUND'>Refund</SelectItem>
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
          Showing {positions.length} of {pagination.total} room trading
          positions
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Positions Table */}
      <UserPositionsTableRoomTrading
        positions={positions}
        loading={loading}
        onUpdateRealTimePnL={updateRealTimePnL}
        realTimePnL={realTimePnL}
      />

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
