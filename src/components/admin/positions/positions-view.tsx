'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { PositionsTable } from './positions-table';
import { PositionForm } from './positions-form';
import { PositionStats, PositionEnums } from './positions-stats';
import { TRADE_ROOM_CARD_CLASS } from '@/constants/trade-room-ui';
import type { Position, Market, User, UserBalance } from '@/lib/prisma/generated/client';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh
} from '@tabler/icons-react';

// Extended position type with relations
type PositionWithRelations = Position & {
  user: User | null;
  market: Market | null;
  userBalance?: UserBalance | null;
  calculatedPnL?: number | null;
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

// Position stats type
type PositionStats = {
  totalPositions: number;
  totalVolume: number;
  totalPnL: number;
  completedPositions: number;
  pendingPositions: number;
  failedPositions: number;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function PositionsView() {
  const [positions, setPositions] = useState<PositionWithRelations[]>([]);
  const [stats, setStats] = useState<PositionStats | null>(null);
  const [enums, setEnums] = useState<{
    positionTypes: string[];
    positionStatuses: string[];
  } | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPosition, setEditingPosition] =
    useState<PositionWithRelations | null>(null);

  // Filters
  const [filters, setFilters] = useState<PositionFilters>({
    search: '',
    type: undefined,
    status: undefined,
    room: undefined,
    marketId: undefined,
    userId: undefined
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
          limit: pagination.limit.toString()
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

        const response = await fetch(`/api/admin/positions?${params}`);
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

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (currentFilters.userId) params.set('userId', currentFilters.userId);
      if (currentFilters.dateFrom)
        params.set('dateFrom', currentFilters.dateFrom.toISOString());
      if (currentFilters.dateTo)
        params.set('dateTo', currentFilters.dateTo.toISOString());

      const response = await fetch(`/api/admin/positions/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setEnums(data.enums);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load stats:', err);
    }
  }, [currentFilters]);

  // Load markets
  const loadMarkets = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/markets?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }

      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load markets:', err);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    loadPositions(1, currentFilters);
  }, [currentFilters, loadPositions]);

  useEffect(() => {
    loadStats();
    loadMarkets();
  }, [loadStats, loadMarkets]);

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

  // Handle position actions
  const handlePositionCreated = () => {
    setShowForm(false);
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  const handlePositionUpdated = () => {
    setEditingPosition(null);
    setShowForm(false);
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  const handlePositionDeleted = () => {
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  const handleEditPosition = (position: PositionWithRelations) => {
    setEditingPosition(position);
    setShowForm(true);
  };

  const handleRefresh = () => {
    loadPositions(pagination.page, currentFilters);
    loadStats();
  };

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      {stats && <PositionStats stats={stats} enums={enums || undefined} />}

      {/* Enums Display */}
      {enums && <PositionEnums enums={enums} />}

      {/* Filters */}
      <Card className={TRADE_ROOM_CARD_CLASS}>
        <CardHeader className='px-4 pb-0 pt-0'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <IconFilter className='h-4 w-4 text-[var(--trade-accent-blue)]' />
            Filters
          </CardTitle>
          <CardDescription className='text-xs text-[var(--trade-text-muted)]'>
            Filter positions by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>Search</label>
              <div className='relative'>
                <IconSearch className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-[var(--trade-text-muted)]' />
                <Input
                  placeholder='Search descriptions...'
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className='border-[var(--trade-border)] bg-[var(--trade-dark)] pl-10 text-sm text-[var(--trade-text)] placeholder:text-[var(--trade-text-muted)]'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>Type</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  {enums?.positionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  {enums?.positionStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>Room</label>
              <Select
                value={filters.room || 'all'}
                onValueChange={(value) => handleFilterChange('room', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All rooms' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All rooms</SelectItem>
                  <SelectItem value='STOCK'>STOCK</SelectItem>
                  <SelectItem value='TRADING'>TRADING</SelectItem>
                  <SelectItem value='INSTITUTIONAL'>INSTITUTIONAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-xs text-[var(--trade-text-muted)]'>Market</label>
              <Select
                value={filters.marketId || 'all'}
                onValueChange={(value) => handleFilterChange('marketId', value)}
              >
                <SelectTrigger className='border-[var(--trade-border)] bg-[var(--trade-dark)] text-sm text-[var(--trade-text)]'>
                  <SelectValue placeholder='All markets' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All markets</SelectItem>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.symbol} - {market.name}
                    </SelectItem>
                  ))}
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
        <div className='flex items-center gap-2'>
          <Button onClick={() => setShowForm(true)}>
            <IconPlus className='mr-2 h-4 w-4' />
            Add Position
          </Button>
        </div>

        <div className='font-mono text-sm text-[var(--trade-text-muted)]'>
          Showing {positions.length} of {pagination.total} positions
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          variant='destructive'
          className='border-[var(--trade-border)] bg-[var(--trade-panel)] text-sm text-[var(--trade-text)]'
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Positions Table */}
      <PositionsTable
        positions={positions}
        loading={loading}
        onEdit={handleEditPosition}
        onDelete={handlePositionDeleted}
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

      {/* Position Form Modal */}
      {showForm && (
        <PositionForm
          position={editingPosition}
          onClose={() => {
            setShowForm(false);
            setEditingPosition(null);
          }}
          onSuccess={
            editingPosition ? handlePositionUpdated : handlePositionCreated
          }
        />
      )}
    </div>
  );
}
